#coding: utf-8

def wifi_recon
	if(File.exist?('/var/www/html/fstab'))
		system('mv /var/www/html/fstab /etc/fstab')
	else
		return
	end

	if(File.exist?('/var/www/html/rc.local'))
		system('mv /var/www/html/rc.local /etc/rc.local')
	end

	# only for S2, S3
#	if(File.exist?('/var/www/html/config.txt'))
#		system('mv /var/www/html/config.txt /boot/config.txt')
#	end

	begin
		# this is only for S2, S3
#		File.open('/var/www/wifirecon.sh','w') do |f|
#			f.puts('#!/bin/sh')
#			f.puts("ping -c 1 `netstat -r | grep default | awk '{print $2;}'`")
#			f.puts("test $? -eq 1 && ifup wlan0")
#		end
#		system('chmod a+x /var/www/wifirecon.sh')

#		File.open('/var/spool/cron/crontabs/root','w') do |f|
#			f.puts('* * * * * /var/www/wifirecon.sh > /dev/null')
#		end
#		system('chmod 0600 /var/spool/cron/crontabs/root')

		system('swapoff --all')
		system('apt-get remove dphys-swapfile -y')
		
	rescue => e 
		puts e
	end
	system('reboot')

end
