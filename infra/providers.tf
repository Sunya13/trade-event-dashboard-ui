terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  backend "s3" {
    bucket = "terraform-state"
    key    = "trade-dashboard-ui.tfstate"

    # Standard settings for R2 compatibility
    region                      = "auto"
    skip_region_validation      = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    # Note: access_key and secret_key are provided via environment variables
  }
}
