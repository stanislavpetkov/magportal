#!/bin/bash
ssh root@172.16.58.11 'LD_LIBRARY_PATH=/lib:/usr/local/lib:/usr/local/share/app/lib:/usr/local/n/bin /mnt/Userfs/data/fbdump /mnt/Userfs/data/screen.bmp'
scp root@172.16.58.11:/mnt/Userfs/data/screen.bmp .
