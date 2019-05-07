#!/bin/bash
sshpass -f <(printf '%s\n' 930920) ssh root@172.16.58.11 'LD_LIBRARY_PATH=/lib:/usr/local/lib:/usr/local/share/app/lib:/usr/local/n/bin /mnt/Userfs/data/fbdump -size 1920,1080 /mnt/Userfs/data/screen.bmp'
sshpass -f <(printf '%s\n' 930920) scp root@172.16.58.11:/mnt/Userfs/data/screen.bmp .
