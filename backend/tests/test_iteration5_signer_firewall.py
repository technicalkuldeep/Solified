"""
Backend API tests for Solified - Iteration 5 Features: Signer Firewall
Tests: POST /api/analyze-transaction endpoint with various transaction scenarios
- Valid base64 SOL Transfer tx
- Empty/missing transaction returns 400
- Invalid base64 returns 400
- Synthetic SOL Transfer (legacy) decodes correctly
- Unknown program ID produces warning
- SPL Token Approve(u64::MAX) produces unlimited approval warning
- All existing endpoints still work
- Extension zip contains inject.js and manifest v1.2.0
"""
import pytest
import requests
import os
import zipfile
import io
import base64
import struct

# Use the public URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://token-safety-1.preview.emergentagent.com"

# Test addresses
USDC_TOKEN = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
JUPITER_WALLET = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
BONK_TOKEN = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"

# System Program ID (32 bytes of 0s except last byte is 0)
SYSTEM_PROGRAM_BYTES = bytes([0] * 32)
# SPL Token Program ID
TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"


def build_synthetic_sol_transfer_tx():
    """
    Build a synthetic legacy SOL transfer transaction for testing.
    Structure: 1 signature (64 bytes of 0), header [1,0,1], 3 accounts, zero blockhash, 1 instruction
    """
    import base58
    
    # Signature (64 bytes of zeros - placeholder)
    signature = bytes([0] * 64)
    
    # Header: [num_required_sigs, num_readonly_signed, num_readonly_unsigned]
    header = bytes([1, 0, 1])
    
    # Generate 3 accounts: sender, recipient, system_program
    sender = bytes([1] * 32)  # Arbitrary sender
    recipient = bytes([2] * 32)  # Arbitrary recipient
    system_program = bytes([0] * 32)  # System Program (all zeros)
    
    # Account count (compact-u16 encoding for 3)
    account_count = bytes([3])
    
    # Recent blockhash (32 bytes of zeros)
    blockhash = bytes([0] * 32)
    
    # Instruction count (compact-u16 encoding for 1)
    instruction_count = bytes([1])
    
    # Instruction:
    # - program_id_index: 2 (system_program is at index 2)
    # - account_indices: [0, 1] (sender, recipient)
    # - data: System Transfer instruction (tag=2, lamports=500_000_000 = 0.5 SOL)
    program_id_index = bytes([2])
    account_indices_len = bytes([2])
    account_indices = bytes([0, 1])
    
    # System Transfer data: 4-byte tag (2 as little-endian u32) + 8-byte lamports
    transfer_tag = struct.pack('<I', 2)  # tag = 2 for Transfer
    lamports = struct.pack('<Q', 500_000_000)  # 0.5 SOL
    instruction_data = transfer_tag + lamports
    instruction_data_len = bytes([len(instruction_data)])
    
    # Build the message
    message = (
        header +
        account_count +
        sender + recipient + system_program +
        blockhash +
        instruction_count +
        program_id_index +
        account_indices_len + account_indices +
        instruction_data_len + instruction_data
    )
    
    # Build full transaction: signature_count + signature + message
    sig_count = bytes([1])
    tx_bytes = sig_count + signature + message
    
    return base64.b64encode(tx_bytes).decode('ascii')


def build_unknown_program_tx():
    """
    Build a synthetic transaction that calls an unknown program.
    """
    import base58
    
    signature = bytes([0] * 64)
    header = bytes([1, 0, 1])
    
    sender = bytes([1] * 32)
    recipient = bytes([2] * 32)
    # Unknown program - arbitrary 32 bytes that's not a known program
    unknown_program = bytes([0xAB] * 32)
    
    account_count = bytes([3])
    blockhash = bytes([0] * 32)
    instruction_count = bytes([1])
    
    program_id_index = bytes([2])  # unknown_program at index 2
    account_indices_len = bytes([2])
    account_indices = bytes([0, 1])
    
    # Some arbitrary instruction data
    instruction_data = bytes([0, 1, 2, 3, 4, 5, 6, 7])
    instruction_data_len = bytes([len(instruction_data)])
    
    message = (
        header +
        account_count +
        sender + recipient + unknown_program +
        blockhash +
        instruction_count +
        program_id_index +
        account_indices_len + account_indices +
        instruction_data_len + instruction_data
    )
    
    sig_count = bytes([1])
    tx_bytes = sig_count + signature + message
    
    return base64.b64encode(tx_bytes).decode('ascii')


def build_unlimited_approval_tx():
    """
    Build a synthetic SPL Token Approve transaction with u64::MAX amount.
    Token Approve instruction: tag=4, amount=u64::MAX
    """
    import base58
    
    signature = bytes([0] * 64)
    header = bytes([1, 0, 1])
    
    # Accounts: source_token_account, delegate, owner, token_program
    source = bytes([1] * 32)
    delegate = bytes([2] * 32)
    owner = bytes([3] * 32)
    # SPL Token Program ID
    token_program = base58.b58decode(TOKEN_PROGRAM_ID)
    
    account_count = bytes([4])
    blockhash = bytes([0] * 32)
    instruction_count = bytes([1])
    
    program_id_index = bytes([3])  # token_program at index 3
    account_indices_len = bytes([3])
    account_indices = bytes([0, 1, 2])  # source, delegate, owner
    
    # Token Approve instruction: tag=4 (1 byte), amount=u64::MAX (8 bytes)
    approve_tag = bytes([4])
    unlimited_amount = struct.pack('<Q', 0xFFFFFFFFFFFFFFFF)  # u64::MAX
    instruction_data = approve_tag + unlimited_amount
    instruction_data_len = bytes([len(instruction_data)])
    
    message = (
        header +
        account_count +
        source + delegate + owner + token_program +
        blockhash +
        instruction_count +
        program_id_index +
        account_indices_len + account_indices +
        instruction_data_len + instruction_data
    )
    
    sig_count = bytes([1])
    tx_bytes = sig_count + signature + message
    
    return base64.b64encode(tx_bytes).decode('ascii')


class TestAnalyzeTransactionEndpoint:
    """Tests for POST /api/analyze-transaction endpoint"""
    
    def test_empty_transaction_returns_400(self):
        """POST /api/analyze-transaction with empty transaction returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": ""}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"Empty transaction error: {data['detail']}")
    
    def test_missing_transaction_returns_400(self):
        """POST /api/analyze-transaction with missing transaction field returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={}
        )
        # FastAPI returns 422 for missing required field
        assert response.status_code in [400, 422]
        print(f"Missing transaction returns: {response.status_code}")
    
    def test_invalid_base64_returns_400(self):
        """POST /api/analyze-transaction with invalid base64 returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": "not-valid-base64!!!"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"Invalid base64 error: {data['detail']}")
    
    def test_truncated_transaction_returns_400(self):
        """POST /api/analyze-transaction with truncated transaction returns 400"""
        # Just a few bytes - not a valid transaction
        truncated = base64.b64encode(bytes([1, 2, 3, 4])).decode('ascii')
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": truncated}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"Truncated transaction error: {data['detail']}")


class TestSyntheticSOLTransfer:
    """Tests for synthetic SOL Transfer transaction decoding"""
    
    def test_sol_transfer_returns_structured_response(self):
        """Synthetic SOL Transfer tx returns structured response with all required fields"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check all required fields
        assert "score" in data
        assert "riskLevel" in data
        assert "riskColor" in data
        assert "actions" in data
        assert "warnings" in data
        assert "programs" in data
        assert "instructionCount" in data
        assert "version" in data
        assert "simulation" in data
        assert "decoded" in data
        
        print(f"SOL Transfer response: score={data['score']}, riskLevel={data['riskLevel']}, riskColor={data['riskColor']}")
    
    def test_sol_transfer_risk_level_values(self):
        """riskLevel should be Safe/Medium/High"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["riskLevel"] in ["Safe", "Medium", "High"]
        print(f"riskLevel: {data['riskLevel']}")
    
    def test_sol_transfer_risk_color_values(self):
        """riskColor should be green/yellow/red"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["riskColor"] in ["green", "yellow", "red"]
        print(f"riskColor: {data['riskColor']}")
    
    def test_sol_transfer_version_is_legacy(self):
        """Synthetic legacy tx should return version='legacy'"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["version"] == "legacy"
        print(f"version: {data['version']}")
    
    def test_sol_transfer_includes_system_program(self):
        """Programs list should include System Program with trusted=true"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        programs = data["programs"]
        system_programs = [p for p in programs if p.get("name") == "System Program"]
        assert len(system_programs) >= 1, f"Expected System Program in programs list, got {programs}"
        assert system_programs[0]["trusted"] == True
        print(f"System Program found with trusted=True")
    
    def test_sol_transfer_actions_include_transfer(self):
        """Actions should include a Transfer action"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        actions = data["actions"]
        transfer_actions = [a for a in actions if "Transfer" in a and "SOL" in a]
        assert len(transfer_actions) >= 1, f"Expected Transfer SOL action, got {actions}"
        print(f"Transfer action found: {transfer_actions[0]}")
    
    def test_sol_transfer_simulation_structure(self):
        """Simulation should have ok, err, unitsConsumed, logsTail fields"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        sim = data["simulation"]
        assert "ok" in sim
        assert "err" in sim
        assert "unitsConsumed" in sim
        assert "logsTail" in sim
        print(f"Simulation: ok={sim['ok']}, err={sim['err']}")
    
    def test_sol_transfer_decoded_array(self):
        """decoded[] should contain instruction details"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        decoded = data["decoded"]
        assert isinstance(decoded, list)
        assert len(decoded) >= 1
        print(f"Decoded instructions: {len(decoded)}")


class TestUnknownProgramWarning:
    """Tests for unknown program producing warning"""
    
    def test_unknown_program_produces_warning(self):
        """Transaction with unknown program should produce 'Unknown contract interaction' warning"""
        tx_b64 = build_unknown_program_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        warnings = data["warnings"]
        unknown_warnings = [w for w in warnings if "Unknown" in w.get("label", "") or "unknown" in w.get("label", "").lower()]
        assert len(unknown_warnings) >= 1, f"Expected 'Unknown contract interaction' warning, got {warnings}"
        print(f"Unknown program warning found: {unknown_warnings[0]}")
    
    def test_unknown_program_score_deduction(self):
        """Unknown program should cause score deduction (score < 100)"""
        tx_b64 = build_unknown_program_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Unknown program should deduct at least 25 points
        assert data["score"] <= 75, f"Expected score <= 75 for unknown program, got {data['score']}"
        print(f"Unknown program score: {data['score']}")


class TestUnlimitedApprovalWarning:
    """Tests for SPL Token Approve(u64::MAX) producing warning"""
    
    def test_unlimited_approval_produces_warning(self):
        """Transaction with unlimited token approval should produce 'Unlimited token approval' warning"""
        tx_b64 = build_unlimited_approval_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        warnings = data["warnings"]
        approval_warnings = [w for w in warnings if "Unlimited" in w.get("label", "") or "unlimited" in w.get("label", "").lower()]
        assert len(approval_warnings) >= 1, f"Expected 'Unlimited token approval' warning, got {warnings}"
        print(f"Unlimited approval warning found: {approval_warnings[0]}")
    
    def test_unlimited_approval_high_level_warning(self):
        """Unlimited approval warning should be level='high'"""
        tx_b64 = build_unlimited_approval_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        warnings = data["warnings"]
        approval_warnings = [w for w in warnings if "Unlimited" in w.get("label", "") or "unlimited" in w.get("label", "").lower()]
        assert len(approval_warnings) >= 1
        assert approval_warnings[0].get("level") == "high", f"Expected level='high', got {approval_warnings[0].get('level')}"
        print(f"Unlimited approval warning level: {approval_warnings[0].get('level')}")
    
    def test_unlimited_approval_significant_score_deduction(self):
        """Unlimited approval should cause significant score deduction (score <= 70)"""
        tx_b64 = build_unlimited_approval_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Unlimited approval deducts 30 points, simulation failure deducts 10
        # So score should be <= 70 (100 - 30 = 70, or less if simulation also fails)
        assert data["score"] <= 70, f"Expected score <= 70 for unlimited approval, got {data['score']}"
        print(f"Unlimited approval score: {data['score']}")


class TestExistingEndpointsStillWork:
    """Tests to verify all existing endpoints still work"""
    
    def test_health_endpoint(self):
        """GET /api/health returns service='Solified'"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Solified"
        print(f"Health endpoint OK: {data['service']}")
    
    def test_whitelist_endpoint(self):
        """GET /api/whitelist returns tokens and wallets"""
        response = requests.get(f"{BASE_URL}/api/whitelist")
        assert response.status_code == 200
        data = response.json()
        assert "tokens" in data
        assert "wallets" in data
        print(f"Whitelist endpoint OK: {len(data['tokens'])} tokens, {len(data['wallets'])} wallets")
    
    def test_analyze_endpoint(self):
        """POST /api/analyze works for USDC"""
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={"address": USDC_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "riskLevel" in data
        print(f"Analyze endpoint OK: score={data['score']}, riskLevel={data['riskLevel']}")
    
    def test_analyze_wallet_endpoint(self):
        """POST /api/analyze-wallet works for Jupiter"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-wallet",
            json={"address": JUPITER_WALLET}
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        print(f"Analyze-wallet endpoint OK: score={data['score']}")
    
    def test_analyze_token_endpoint(self):
        """POST /api/analyze-token works for BONK"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-token",
            json={"address": BONK_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        print(f"Analyze-token endpoint OK: score={data['score']}")
    
    def test_recent_scans_endpoint(self):
        """GET /api/recent-scans returns list"""
        response = requests.get(f"{BASE_URL}/api/recent-scans")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Recent-scans endpoint OK: {len(data)} scans")


class TestExtensionZipContents:
    """Tests for extension zip containing inject.js and manifest v1.2.0"""
    
    def test_extension_zip_returns_200(self):
        """GET /extension/solified-extension.zip returns 200"""
        response = requests.get(f"{BASE_URL}/extension/solified-extension.zip")
        assert response.status_code == 200
        print("Extension zip returns 200")
    
    def test_extension_zip_contains_inject_js(self):
        """Extension zip should contain inject.js"""
        response = requests.get(f"{BASE_URL}/extension/solified-extension.zip")
        assert response.status_code == 200
        
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            file_list = zf.namelist()
            assert "inject.js" in file_list, f"inject.js not found in zip. Files: {file_list}"
            print(f"inject.js found in extension zip")
    
    def test_extension_zip_manifest_version_1_2_0(self):
        """Extension manifest.json should have version 1.2.0"""
        response = requests.get(f"{BASE_URL}/extension/solified-extension.zip")
        assert response.status_code == 200
        
        import json
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            assert "manifest.json" in zf.namelist()
            manifest_content = zf.read("manifest.json").decode('utf-8')
            manifest = json.loads(manifest_content)
            assert manifest.get("version") == "1.2.0", f"Expected version 1.2.0, got {manifest.get('version')}"
            print(f"Manifest version: {manifest.get('version')}")


class TestAnalyzeTransactionWithUserWallet:
    """Tests for analyze-transaction with optional userWallet parameter"""
    
    def test_with_user_wallet_parameter(self):
        """POST /api/analyze-transaction accepts optional userWallet parameter"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={
                "transaction": tx_b64,
                "userWallet": "11111111111111111111111111111111"  # Arbitrary wallet
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        print(f"With userWallet: score={data['score']}")
    
    def test_without_user_wallet_parameter(self):
        """POST /api/analyze-transaction works without userWallet parameter"""
        tx_b64 = build_synthetic_sol_transfer_tx()
        response = requests.post(
            f"{BASE_URL}/api/analyze-transaction",
            json={"transaction": tx_b64}
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        print(f"Without userWallet: score={data['score']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
