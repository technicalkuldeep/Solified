"""
Backend API tests for Solified - Iteration 6 Features: Deep Intelligence Layer
Tests:
- POST /api/analyze-wallet returns insights.networkRisk with all required fields
- GET /api/wallet-timeline/{address} returns history, count, tagline
- GET /api/known-dapps returns 18+ dApp domains
- POST /api/analyze-transaction with intent/intentDetail fields
- Intent vs Reality mismatch detection (approve+SystemTransfer, swap+unlimited, stake+no-stake-program)
- Score drops by 20 on mismatch, riskLevel/riskColor recompute
- Backwards compat: tx analyzer works without intent param
- All existing endpoints still work
- Extension zip contains dappDetector.js, manifest v1.3.0, two content_scripts entries
"""
import pytest
import requests
import os
import zipfile
import io
import base64
import struct
import json

# Use the public URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://token-safety-1.preview.emergentagent.com"

# Test addresses
USDC_TOKEN = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
JUPITER_WALLET = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
BONK_TOKEN = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"

# SPL Token Program ID
TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"


def build_synthetic_sol_transfer_tx():
    """Build a synthetic legacy SOL transfer transaction for testing."""
    signature = bytes([0] * 64)
    header = bytes([1, 0, 1])
    sender = bytes([1] * 32)
    recipient = bytes([2] * 32)
    system_program = bytes([0] * 32)
    account_count = bytes([3])
    blockhash = bytes([0] * 32)
    instruction_count = bytes([1])
    program_id_index = bytes([2])
    account_indices_len = bytes([2])
    account_indices = bytes([0, 1])
    transfer_tag = struct.pack('<I', 2)
    lamports = struct.pack('<Q', 500_000_000)
    instruction_data = transfer_tag + lamports
    instruction_data_len = bytes([len(instruction_data)])
    
    message = (
        header + account_count + sender + recipient + system_program +
        blockhash + instruction_count + program_id_index +
        account_indices_len + account_indices +
        instruction_data_len + instruction_data
    )
    sig_count = bytes([1])
    tx_bytes = sig_count + signature + message
    return base64.b64encode(tx_bytes).decode('ascii')


def build_unlimited_approval_tx():
    """Build a synthetic SPL Token Approve transaction with u64::MAX amount."""
    import base58
    
    signature = bytes([0] * 64)
    header = bytes([1, 0, 1])
    source = bytes([1] * 32)
    delegate = bytes([2] * 32)
    owner = bytes([3] * 32)
    token_program = base58.b58decode(TOKEN_PROGRAM_ID)
    
    account_count = bytes([4])
    blockhash = bytes([0] * 32)
    instruction_count = bytes([1])
    program_id_index = bytes([3])
    account_indices_len = bytes([3])
    account_indices = bytes([0, 1, 2])
    
    approve_tag = bytes([4])
    unlimited_amount = struct.pack('<Q', 0xFFFFFFFFFFFFFFFF)
    instruction_data = approve_tag + unlimited_amount
    instruction_data_len = bytes([len(instruction_data)])
    
    message = (
        header + account_count + source + delegate + owner + token_program +
        blockhash + instruction_count + program_id_index +
        account_indices_len + account_indices +
        instruction_data_len + instruction_data
    )
    sig_count = bytes([1])
    tx_bytes = sig_count + signature + message
    return base64.b64encode(tx_bytes).decode('ascii')


# ============================================================================
# Tests for /api/analyze-wallet with networkRisk
# ============================================================================
class TestAnalyzeWalletNetworkRisk:
    """Tests for POST /api/analyze-wallet returning insights.networkRisk"""
    
    def test_analyze_wallet_returns_network_risk(self):
        """POST /api/analyze-wallet returns insights.networkRisk object"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-wallet",
            json={"address": JUPITER_WALLET}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "insights" in data
        assert "networkRisk" in data["insights"]
        print(f"networkRisk present in response")
    
    def test_network_risk_has_required_fields(self):
        """networkRisk should have all required fields"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-wallet",
            json={"address": JUPITER_WALLET}
        )
        assert response.status_code == 200
        data = response.json()
        
        nr = data["insights"]["networkRisk"]
        required_fields = [
            "closestScamDistance",
            "connectedScamWallets",
            "connectedCluster",
            "scamCounterparties",
            "clusterCounterparties",
            "totalCounterparties",
            "topCounterparties",
            "txParsed"
        ]
        for field in required_fields:
            assert field in nr, f"Missing field: {field}"
        print(f"All required networkRisk fields present")
    
    def test_network_risk_field_types(self):
        """networkRisk fields should have correct types"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-wallet",
            json={"address": JUPITER_WALLET}
        )
        assert response.status_code == 200
        data = response.json()
        
        nr = data["insights"]["networkRisk"]
        # closestScamDistance can be null or int
        assert nr["closestScamDistance"] is None or isinstance(nr["closestScamDistance"], int)
        assert isinstance(nr["connectedScamWallets"], int)
        assert isinstance(nr["connectedCluster"], int)
        assert isinstance(nr["scamCounterparties"], list)
        assert isinstance(nr["clusterCounterparties"], list)
        assert isinstance(nr["totalCounterparties"], int)
        assert isinstance(nr["topCounterparties"], list)
        assert isinstance(nr["txParsed"], int)
        print(f"networkRisk field types correct")


# ============================================================================
# Tests for /api/wallet-timeline/{address}
# ============================================================================
class TestWalletTimeline:
    """Tests for GET /api/wallet-timeline/{address}"""
    
    def test_wallet_timeline_returns_200(self):
        """GET /api/wallet-timeline/{address} returns 200"""
        response = requests.get(f"{BASE_URL}/api/wallet-timeline/{JUPITER_WALLET}")
        assert response.status_code == 200
        print("wallet-timeline returns 200")
    
    def test_wallet_timeline_response_structure(self):
        """wallet-timeline returns address, history, count, tagline"""
        response = requests.get(f"{BASE_URL}/api/wallet-timeline/{JUPITER_WALLET}")
        assert response.status_code == 200
        data = response.json()
        
        assert "address" in data
        assert "history" in data
        assert "count" in data
        assert "tagline" in data
        assert data["address"] == JUPITER_WALLET
        assert isinstance(data["history"], list)
        assert isinstance(data["count"], int)
        print(f"wallet-timeline structure correct: count={data['count']}")
    
    def test_wallet_timeline_with_days_param(self):
        """wallet-timeline accepts days parameter"""
        response = requests.get(f"{BASE_URL}/api/wallet-timeline/{JUPITER_WALLET}?days=60")
        assert response.status_code == 200
        data = response.json()
        assert "history" in data
        print(f"wallet-timeline with days=60 works")
    
    def test_wallet_timeline_invalid_address(self):
        """wallet-timeline returns 400 for invalid address"""
        response = requests.get(f"{BASE_URL}/api/wallet-timeline/invalid-address")
        assert response.status_code == 400
        print("wallet-timeline returns 400 for invalid address")


# ============================================================================
# Tests for /api/known-dapps
# ============================================================================
class TestKnownDapps:
    """Tests for GET /api/known-dapps"""
    
    def test_known_dapps_returns_200(self):
        """GET /api/known-dapps returns 200"""
        response = requests.get(f"{BASE_URL}/api/known-dapps")
        assert response.status_code == 200
        print("known-dapps returns 200")
    
    def test_known_dapps_has_18_plus_entries(self):
        """known-dapps returns 18+ dApp domains"""
        response = requests.get(f"{BASE_URL}/api/known-dapps")
        assert response.status_code == 200
        data = response.json()
        
        assert "dapps" in data
        assert len(data["dapps"]) >= 18, f"Expected 18+ dApps, got {len(data['dapps'])}"
        print(f"known-dapps has {len(data['dapps'])} entries")
    
    def test_known_dapps_entry_structure(self):
        """Each dApp entry has name and domain"""
        response = requests.get(f"{BASE_URL}/api/known-dapps")
        assert response.status_code == 200
        data = response.json()
        
        for dapp in data["dapps"]:
            assert "name" in dapp, f"Missing name in dApp entry"
            assert "domain" in dapp, f"Missing domain in dApp entry"
        print("All dApp entries have name and domain")
    
    def test_known_dapps_includes_major_dapps(self):
        """known-dapps includes major Solana dApps"""
        response = requests.get(f"{BASE_URL}/api/known-dapps")
        assert response.status_code == 200
        data = response.json()
        
        domains = [d["domain"] for d in data["dapps"]]
        major_dapps = ["jup.ag", "raydium.io", "orca.so", "phantom.app", "solscan.io"]
        for dapp in major_dapps:
            assert dapp in domains, f"Missing major dApp: {dapp}"
        print("All major dApps present")


# ============================================================================
# Tests for Intent vs Reality detection
# ============================================================================
class TestIntentVsReality:
    """Tests for POST /api/analyze-transaction with intent/intentDetail"""
    
    def test_approve_intent_with_system_transfer_mismatch(self):
        """intent='approve' with SystemTransfer triggers mismatch warning"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={
                "transaction": tx_b64,
                "intent": "approve",
                "intentDetail": "Approve Token"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check intent field present
        assert "intent" in data
        assert data["intent"]["normalized"] == "approve"
        assert data["intent"]["mismatch"] is not None
        
        # Check warning added
        warnings = [w["label"] for w in data.get("warnings", [])]
        assert "Intent vs Reality mismatch" in warnings
        print(f"approve+SystemTransfer mismatch detected: {data['intent']['mismatch']}")
    
    def test_swap_intent_with_unlimited_approval_mismatch(self):
        """intent='swap' with unlimited approval triggers drainer pattern warning"""
        tx_b64 = build_unlimited_approval_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={
                "transaction": tx_b64,
                "intent": "swap",
                "intentDetail": "Swap SOL for USDC"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "intent" in data
        assert data["intent"]["normalized"] == "swap"
        assert data["intent"]["mismatch"] is not None
        assert "drainer" in data["intent"]["mismatch"].lower()
        
        warnings = [w["label"] for w in data.get("warnings", [])]
        assert "Intent vs Reality mismatch" in warnings
        print(f"swap+unlimited approval mismatch detected: {data['intent']['mismatch']}")
    
    def test_mismatch_warning_has_high_level(self):
        """Intent vs Reality mismatch warning should have level='high'"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={
                "transaction": tx_b64,
                "intent": "approve"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        mismatch_warnings = [w for w in data.get("warnings", []) if "Intent" in w.get("label", "")]
        assert len(mismatch_warnings) >= 1
        assert mismatch_warnings[0]["level"] == "high"
        print("Mismatch warning has level='high'")
    
    def test_mismatch_drops_score_by_20(self):
        """Mismatch detection should drop score by 20"""
        # First get baseline score without intent
        tx_b64 = build_synthetic_sol_transfer_tx()
        response_no_intent = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        baseline_score = response_no_intent.json()["score"]
        
        # Now with intent that triggers mismatch
        response_with_intent = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={
                "transaction": tx_b64,
                "intent": "approve"
            }
        )
        mismatch_score = response_with_intent.json()["score"]
        
        # Score should be 20 less (or clamped to 0)
        expected_score = max(0, baseline_score - 20)
        assert mismatch_score == expected_score, f"Expected {expected_score}, got {mismatch_score}"
        print(f"Score dropped from {baseline_score} to {mismatch_score} (expected {expected_score})")
    
    def test_mismatch_recomputes_risk_level(self):
        """Mismatch should recompute riskLevel/riskColor based on new score"""
        tx_b64 = build_unlimited_approval_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={
                "transaction": tx_b64,
                "intent": "swap"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        score = data["score"]
        risk_level = data["riskLevel"]
        risk_color = data["riskColor"]
        
        # Verify risk level matches score
        if score >= 80:
            assert risk_level == "Safe" and risk_color == "green"
        elif score >= 50:
            assert risk_level == "Medium" and risk_color == "yellow"
        else:
            assert risk_level == "High" and risk_color == "red"
        print(f"Risk level correctly computed: score={score}, level={risk_level}, color={risk_color}")
    
    def test_intent_response_structure(self):
        """intent field should have raw, normalized, expected, actual, mismatch"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={
                "transaction": tx_b64,
                "intent": "send",
                "intentDetail": "Send SOL"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "intent" in data
        intent = data["intent"]
        assert "raw" in intent
        assert "normalized" in intent
        assert "expected" in intent
        assert "actual" in intent
        assert "mismatch" in intent
        print(f"Intent structure correct: {list(intent.keys())}")


# ============================================================================
# Tests for backwards compatibility
# ============================================================================
class TestBackwardsCompatibility:
    """Tests for backwards compatibility - tx analyzer works without intent"""
    
    def test_analyze_transaction_without_intent(self):
        """POST /api/analyze-transaction works without intent param"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should NOT have intent field when not provided
        assert "intent" not in data
        assert "score" in data
        assert "riskLevel" in data
        print("Backwards compat: no intent field when not provided")
    
    def test_analyze_transaction_with_empty_intent(self):
        """POST /api/analyze-transaction with empty intent string"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={
                "transaction": tx_b64,
                "intent": ""
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Empty intent should be treated as no intent
        assert "intent" not in data
        print("Backwards compat: empty intent treated as no intent")


# ============================================================================
# Tests for existing endpoints still working
# ============================================================================
class TestExistingEndpoints:
    """Tests to verify all existing endpoints still work"""
    
    def test_health_endpoint(self):
        """GET /api/health returns service='Solified'"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Solified"
        print(f"Health endpoint OK")
    
    def test_whitelist_endpoint(self):
        """GET /api/whitelist returns tokens and wallets"""
        response = requests.get(f"{BASE_URL}/api/whitelist")
        assert response.status_code == 200
        data = response.json()
        assert "tokens" in data
        assert "wallets" in data
        print(f"Whitelist endpoint OK")
    
    def test_analyze_endpoint(self):
        """POST /api/analyze works for USDC"""
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={"address": USDC_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        print(f"Analyze endpoint OK")
    
    def test_analyze_token_endpoint(self):
        """POST /api/analyze-token works for BONK"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-token",
            json={"address": BONK_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        print(f"Analyze-token endpoint OK")
    
    def test_recent_scans_endpoint(self):
        """GET /api/recent-scans returns list"""
        response = requests.get(f"{BASE_URL}/api/recent-scans")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Recent-scans endpoint OK")
    
    def test_analyze_transaction_basic(self):
        """POST /api/analyze-transaction basic functionality"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "riskLevel" in data
        assert "actions" in data
        print(f"Analyze-transaction basic OK")


# ============================================================================
# Tests for extension zip
# ============================================================================
class TestExtensionZip:
    """Tests for extension zip containing dappDetector.js and manifest v1.3.0"""
    
    def test_extension_zip_returns_200(self):
        """GET /extension/solified-extension.zip returns 200"""
        response = requests.get(f"{BASE_URL}/extension/solified-extension.zip")
        assert response.status_code == 200
        print("Extension zip returns 200")
    
    def test_extension_zip_contains_dapp_detector(self):
        """Extension zip should contain dappDetector.js"""
        response = requests.get(f"{BASE_URL}/extension/solified-extension.zip")
        assert response.status_code == 200
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            file_list = zf.namelist()
            assert "dappDetector.js" in file_list, f"dappDetector.js not found. Files: {file_list}"
        print("dappDetector.js found in extension zip")
    
    def test_extension_zip_contains_inject_js(self):
        """Extension zip should contain inject.js"""
        response = requests.get(f"{BASE_URL}/extension/solified-extension.zip")
        assert response.status_code == 200
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            file_list = zf.namelist()
            assert "inject.js" in file_list, f"inject.js not found. Files: {file_list}"
        print("inject.js found in extension zip")
    
    def test_extension_manifest_version_1_3_0(self):
        """Extension manifest.json should have version 1.3.0"""
        response = requests.get(f"{BASE_URL}/extension/solified-extension.zip")
        assert response.status_code == 200
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            assert "manifest.json" in zf.namelist()
            manifest_content = zf.read("manifest.json").decode('utf-8')
            manifest = json.loads(manifest_content)
            assert manifest.get("version") == "1.3.0", f"Expected version 1.3.0, got {manifest.get('version')}"
        print(f"Manifest version: 1.3.0")
    
    def test_extension_manifest_has_two_content_scripts(self):
        """Extension manifest should have two content_scripts entries"""
        response = requests.get(f"{BASE_URL}/extension/solified-extension.zip")
        assert response.status_code == 200
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            manifest_content = zf.read("manifest.json").decode('utf-8')
            manifest = json.loads(manifest_content)
            content_scripts = manifest.get("content_scripts", [])
            assert len(content_scripts) == 2, f"Expected 2 content_scripts, got {len(content_scripts)}"
        print("Manifest has 2 content_scripts entries")
    
    def test_extension_manifest_isolated_world_script(self):
        """First content_script should load content.js and dappDetector.js"""
        response = requests.get(f"{BASE_URL}/extension/solified-extension.zip")
        assert response.status_code == 200
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            manifest_content = zf.read("manifest.json").decode('utf-8')
            manifest = json.loads(manifest_content)
            content_scripts = manifest.get("content_scripts", [])
            
            # Find the ISOLATED world script (no world key or world != MAIN)
            isolated_script = None
            for cs in content_scripts:
                if cs.get("world") != "MAIN":
                    isolated_script = cs
                    break
            
            assert isolated_script is not None, "No ISOLATED world content_script found"
            js_files = isolated_script.get("js", [])
            assert "content.js" in js_files, f"content.js not in ISOLATED script: {js_files}"
            assert "dappDetector.js" in js_files, f"dappDetector.js not in ISOLATED script: {js_files}"
        print("ISOLATED world script loads content.js and dappDetector.js")
    
    def test_extension_manifest_main_world_script(self):
        """Second content_script should load inject.js in MAIN world"""
        response = requests.get(f"{BASE_URL}/extension/solified-extension.zip")
        assert response.status_code == 200
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            manifest_content = zf.read("manifest.json").decode('utf-8')
            manifest = json.loads(manifest_content)
            content_scripts = manifest.get("content_scripts", [])
            
            # Find the MAIN world script
            main_script = None
            for cs in content_scripts:
                if cs.get("world") == "MAIN":
                    main_script = cs
                    break
            
            assert main_script is not None, "No MAIN world content_script found"
            js_files = main_script.get("js", [])
            assert "inject.js" in js_files, f"inject.js not in MAIN script: {js_files}"
        print("MAIN world script loads inject.js")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
