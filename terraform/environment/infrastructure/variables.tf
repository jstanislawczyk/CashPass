variable "project_name" {
  description = "Project name"
  type        = string
  default     = "cash-pass"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "workspace" {
  description = "Name of current workspace"
  type        = string
}

variable "tags" {
  description = "A map of tags for all resources"
  type        = map(string)
  default     = {}
}
