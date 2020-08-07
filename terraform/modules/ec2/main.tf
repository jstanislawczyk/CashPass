# This requires existing key
resource "aws_key_pair" "ec2_keys" {
  key_name   = "${var.prefix}-ec2key"
  public_key = file("${path.module}/ssh-keys/ec2key.pub")
}

resource "aws_instance" "ec2" {
  key_name      = aws_key_pair.ec2_keys.key_name
  ami           = var.ami
  instance_type = var.instance_type
  user_data     = file("${path.module}/scripts/${var.script_name}")

  associate_public_ip_address = true

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = file("${path.module}/ssh-keys/ec2key")
    host        = self.public_ip
  }

  tags = var.tags
}