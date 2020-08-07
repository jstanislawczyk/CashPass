#!/bin/bash

rm -rf migrations.zip

zip -r migrations ../sql

scp -r -i ../../../terraform/modules/ec2/ssh-keys/ec2key ./migrations.zip $1:migrations.zip

ssh -o "StrictHostKeyChecking no" -i ../../../terraform/modules/ec2/ssh-keys/ec2key $1 -t "export login=\"$2\" password=\"$3\" url=\"$4\"; bash" << "ENDSSH"
  unzip migrations.zip

  sudo mv sql/* /flyway-6.4.3/sql/
  sudo flyway migrate -user=$login -password=$password -url=$url

  rm -rf *
ENDSSH
