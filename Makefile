SHELL := /bin/bash
current_dir = $(shell pwd)
basename_dir = $(shell basename $(current_dir))

.PHONY: select_workspace init_workspace terraform terraform-target

# Terraform
select_workspace:
	terraform init -backend-config="key=cash-pass/$(key)"
	terraform workspace select $(workspace)

init_workspace:
	terraform init -backend-config="key=cash-pass/$(key)"
	terraform workspace new $(workspace) || terraform workspace select $(workspace)
	terraform workspace select $(workspace)
	
terraform: select_workspace
	terraform $(command) -var "workspace=$(workspace)"

terraform-auto: select_workspace
	terraform $(command) \
		-var "workspace=$(workspace)" \
		-auto-approve

terraform-target: select_workspace
	terraform $(command) \
		-target=$(target) \
		-var "workspace=$(workspace)"

terraform-target-auto: select_workspace
	terraform $(command) \
		-target=$(target) \
		-var "workspace=$(workspace)" \
		-auto-approve
