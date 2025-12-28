variable "cloudflare_api_token" {
  description = "Your Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Your Cloudflare Account ID"
  type        = string
}

variable "github_owner" {
  type    = string
  description = "Your GitHub Username"
}

variable "github_repo" {
  type    = string
  default = "trade-event-dashboard-ui"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}