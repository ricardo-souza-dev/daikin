# coding: utf-8
require_relative 'HostNetworkInfo'
require_relative 'GpioPin'

def reset_network
	net = HostNetworkInfo.new
	info = {'ipaddr'=>nil, 'netmask'=>nil, 'gateway'=>nil, 'dns'=>nil, 'wifi'=>'false', 'dhcp'=>'true'}
	net.set_network(info)
end

pin = GpioPin.new(21, "in")

loop do	
	if(pin.stat == 'on' && pin.changed?)
		sleep 1
		if(pin.stat == 'on')
			puts "Reset network setting"
			reset_network
			sleep 2
			system('reboot')
		end
	end
	sleep 1	# wait 1 sec
end

