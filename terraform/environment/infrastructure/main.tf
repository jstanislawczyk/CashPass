provider "aws" {
  region = var.region
}

terraform {
  backend "s3" {
    bucket = "payment-system-terraform-state"
    region = "us-east-1"
  }
}

module "flyway_ec2" {
  source = "../../modules/ec2"

  script_name = "install-flyway.sh"

  tags   = var.tags
  prefix = local.prefix
}

resource "aws_s3_bucket" "lambdas_bucket" {
  bucket = "${local.prefix}-lambdas"
  acl    = "private"

  force_destroy = true

  tags = var.tags
}
