variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "project_name" {
  type    = string
  default = "ccp-cloud-native"
}

variable "gemini_api_key" {
  description = "Gemini API Key for AI Strategy"
  type        = string
  sensitive   = true
}

