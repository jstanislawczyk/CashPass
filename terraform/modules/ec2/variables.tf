variable "tags" {
  description = "A map of tags for all resources"
  type        = map(string)
  default     = {}
}

variable "prefix" {
  description = "Resource name prefix"
  type        = string
  default     = "dev"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "ami" {
  description = "AMI"
  type        = string
  default     = "ami-085925f297f89fce1"
}

variable "script_name" {
  description = "User data script name"
  type        = string
  default     = "update-apt.sh"
}
