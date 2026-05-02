"""
Backend API tests for Solified - Iteration 4 Features
Tests: Rebrand to Solified, flags/isWhitelisted/lastAnalyzedAt fields, /api/whitelist endpoint, Verified risk level
"""
import pytest
import requests
import os
import zipfile
import io

# Use the public URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://token-safety-1.preview.emergentagent.com"

# Test addresses
USDC_TOKEN = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"  # USDC - whitelisted token
JUPITER_WALLET = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"  # Jupiter - whitelisted wallet
BONK_TOKEN = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"  # BONK - not whitelisted
INVALID_ADDRESS = "notavalidaddress"


class TestHealthEndpointRebrand:
    """Tests for rebranded health endpoint"""
    
    def test_health_returns_solified_service(self):
        """GET /api/health returns service='Solified'"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Solified"
        print(f"Health service: {data['service']}")
    
    def test_health_returns_tagline(self):
        """GET /api/health returns tagline='Solified — Verify Before You Trust'"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["tagline"] == "Solified — Verify Before You Trust"
        print(f"Health tagline: {data['tagline']}")


class TestWhitelistEndpoint:
    """Tests for new /api/whitelist endpoint"""
    
    def test_whitelist_returns_tokens_and_wallets(self):
        """GET /api/whitelist returns tokens[] and wallets[]"""
        response = requests.get(f"{BASE_URL}/api/whitelist")
        assert response.status_code == 200
        data = response.json()
        assert "tokens" in data
        assert "wallets" in data
        assert isinstance(data["tokens"], list)
        assert isinstance(data["wallets"], list)
        print(f"Whitelist: {len(data['tokens'])} tokens, {len(data['wallets'])} wallets")
    
    def test_whitelist_has_10_tokens(self):
        """Whitelist should have 10 token entries including USDC"""
        response = requests.get(f"{BASE_URL}/api/whitelist")
        assert response.status_code == 200
        data = response.json()
        assert len(data["tokens"]) == 10, f"Expected 10 tokens, got {len(data['tokens'])}"
        
        # Verify USDC is in the list
        usdc_entries = [t for t in data["tokens"] if t["address"] == USDC_TOKEN]
        assert len(usdc_entries) == 1, "USDC should be in whitelist"
        assert usdc_entries[0]["symbol"] == "USDC"
        print(f"Found USDC in whitelist: {usdc_entries[0]}")
    
    def test_whitelist_has_7_wallets(self):
        """Whitelist should have 7+ wallet entries including Jupiter/Raydium/Orca/Marinade"""
        response = requests.get(f"{BASE_URL}/api/whitelist")
        assert response.status_code == 200
        data = response.json()
        assert len(data["wallets"]) >= 7, f"Expected 7+ wallets, got {len(data['wallets'])}"
        
        # Verify key wallets are present
        wallet_addresses = [w["address"] for w in data["wallets"]]
        assert JUPITER_WALLET in wallet_addresses, "Jupiter should be in whitelist"
        assert "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8" in wallet_addresses, "Raydium should be in whitelist"
        assert "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc" in wallet_addresses, "Orca should be in whitelist"
        assert "MarBmsSgKXdrN1egZf5sqe1TMThczhMLJhidtgXZLCDS" in wallet_addresses, "Marinade should be in whitelist"
        assert "11111111111111111111111111111111" in wallet_addresses, "System Program should be in whitelist"
        assert "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" in wallet_addresses, "SPL Token should be in whitelist"
        assert "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" in wallet_addresses, "ATA should be in whitelist"
        print(f"All required wallets found in whitelist")


class TestUSDCVerifiedResponse:
    """Tests for USDC (whitelisted token) returning Verified status"""
    
    def test_usdc_returns_verified_risk_level(self):
        """POST /api/analyze for USDC returns riskLevel='Verified'"""
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={"address": USDC_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["riskLevel"] == "Verified", f"Expected 'Verified', got '{data['riskLevel']}'"
        print(f"USDC riskLevel: {data['riskLevel']}")
    
    def test_usdc_returns_is_whitelisted_true(self):
        """POST /api/analyze for USDC returns isWhitelisted=true"""
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={"address": USDC_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["isWhitelisted"] == True, f"Expected isWhitelisted=True, got {data['isWhitelisted']}"
        print(f"USDC isWhitelisted: {data['isWhitelisted']}")
    
    def test_usdc_returns_trusted_flag(self):
        """POST /api/analyze for USDC returns flags=['trusted']"""
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={"address": USDC_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "flags" in data
        assert "trusted" in data["flags"], f"Expected 'trusted' in flags, got {data['flags']}"
        print(f"USDC flags: {data['flags']}")
    
    def test_usdc_returns_last_analyzed_at(self):
        """POST /api/analyze for USDC returns lastAnalyzedAt field"""
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={"address": USDC_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "lastAnalyzedAt" in data
        assert data["lastAnalyzedAt"] is not None
        print(f"USDC lastAnalyzedAt: {data['lastAnalyzedAt']}")


class TestJupiterVerifiedResponse:
    """Tests for Jupiter (whitelisted wallet) returning Verified status"""
    
    def test_jupiter_returns_verified_risk_level(self):
        """POST /api/analyze-wallet for Jupiter returns riskLevel='Verified'"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-wallet",
            json={"address": JUPITER_WALLET}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["riskLevel"] == "Verified", f"Expected 'Verified', got '{data['riskLevel']}'"
        print(f"Jupiter riskLevel: {data['riskLevel']}")
    
    def test_jupiter_returns_is_whitelisted_true(self):
        """POST /api/analyze-wallet for Jupiter returns isWhitelisted=true"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-wallet",
            json={"address": JUPITER_WALLET}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["isWhitelisted"] == True
        print(f"Jupiter isWhitelisted: {data['isWhitelisted']}")
    
    def test_jupiter_returns_trusted_flag(self):
        """POST /api/analyze-wallet for Jupiter returns flags includes 'trusted'"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-wallet",
            json={"address": JUPITER_WALLET}
        )
        assert response.status_code == 200
        data = response.json()
        assert "trusted" in data["flags"], f"Expected 'trusted' in flags, got {data['flags']}"
        print(f"Jupiter flags: {data['flags']}")


class TestBONKNonWhitelistedResponse:
    """Tests for BONK (non-whitelisted token) response"""
    
    def test_bonk_returns_is_whitelisted_false(self):
        """POST /api/analyze-token for BONK returns isWhitelisted=false"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-token",
            json={"address": BONK_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["isWhitelisted"] == False
        print(f"BONK isWhitelisted: {data['isWhitelisted']}")
    
    def test_bonk_returns_flags_list(self):
        """POST /api/analyze-token for BONK returns flags list (may be empty or have heuristic flags)"""
        response = requests.post(
            f"{BASE_URL}/api/analyze-token",
            json={"address": BONK_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "flags" in data
        assert isinstance(data["flags"], list)
        print(f"BONK flags: {data['flags']}")


class TestInvalidAddressReturns400:
    """Tests for invalid address handling"""
    
    def test_analyze_invalid_address_returns_400(self):
        """POST /api/analyze for invalid address returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={"address": INVALID_ADDRESS}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"Invalid address error: {data['detail']}")


class TestResponseBackwardCompatibility:
    """Tests for backward compatible response shape"""
    
    def test_response_has_old_fields(self):
        """Response should have old fields: score, riskLevel, riskColor, reasons, insights, cached, analyzedAt"""
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            json={"address": USDC_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Old fields
        assert "score" in data
        assert "riskLevel" in data
        assert "riskColor" in data
        assert "reasons" in data
        assert "insights" in data
        assert "cached" in data
        assert "analyzedAt" in data
        
        # New fields
        assert "flags" in data
        assert "isWhitelisted" in data
        assert "lastAnalyzedAt" in data
        
        print(f"All backward compatible fields present")


class TestExtensionZipDownload:
    """Tests for renamed extension zip download"""
    
    def test_solified_extension_zip_returns_200(self):
        """GET /extension/solified-extension.zip returns HTTP 200"""
        response = requests.get(
            f"{BASE_URL}/extension/solified-extension.zip",
            stream=True
        )
        assert response.status_code == 200
        print(f"solified-extension.zip returns 200")
    
    def test_solified_extension_zip_is_valid(self):
        """Extension zip should be valid and ~14KB"""
        response = requests.get(
            f"{BASE_URL}/extension/solified-extension.zip"
        )
        assert response.status_code == 200
        
        content_length = len(response.content)
        assert content_length > 10000, f"Zip should be >10KB, got {content_length} bytes"
        
        # Verify it's a valid zip
        try:
            with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
                file_list = zf.namelist()
                assert len(file_list) > 0
                assert "manifest.json" in file_list
                print(f"Extension zip valid: {content_length} bytes, {len(file_list)} files")
        except zipfile.BadZipFile:
            pytest.fail("Downloaded file is not a valid zip")


class TestRootEndpointRebrand:
    """Tests for rebranded root endpoint"""
    
    def test_root_returns_solified_service(self):
        """GET /api/ returns service='Solified'"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "Solified"
        assert data["tagline"] == "Solified — Verify Before You Trust"
        print(f"Root endpoint: service={data['service']}, tagline={data['tagline']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
