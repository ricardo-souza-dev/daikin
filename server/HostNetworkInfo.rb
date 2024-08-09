# coding:utf-8

class HostNetworkInfo
	@@wpa_path = '/etc/wpa_supplicant/wpa_supplicant.conf'

	def self.wpa_path
		@@wpa_path
	end

	def initialize
		@wifi = false
		@dhcp = true
		@ipaddr = ""
		@path = ""
		@wifi_path = ""
		@netmask = ""
		@gateway = ""
		@dns = ""
		@mask_array = ["0","128","192","224","240","248","252","254","255"]

		if(RUBY_PLATFORM.index("linux"))
			@path = "/etc/dhcp/dhclient.conf"
			@wifi = true if(`ifconfig wlan0 | grep inet`.length > 0)

			path = @path

			File.open(path, "r") do |f|
				f.each_line do |line|
					line.strip!
					next if(line[0] == '#')
					if(line.index("ip_address="))
						info = line.split("=")
						next if(info.size < 2 || info[1].length < 1)
						info = info[1].split("/")
						@ipaddr = info[0].strip
						@netmask = make_mask(info[1].to_i) if info.length > 1
						@dhcp = false
					elsif(line.index("routers="))
						info = line.split("=")
						@gateway = info[1].strip if info.size > 1
					elsif(line.index("domain_name_servers="))
						info = line.split("=")
						@dns = info[1].strip if info.size > 1
					end
				end
			end
		end
	end

	def get_network_info
		return nil if(@path == "") 	# in the case of windows
		{'ipaddr'=>@ipaddr, 'netmask'=>@netmask, 'gateway'=>@gateway, 'dns'=>@dns, 'wifi'=>@wifi, 'dhcp'=>@dhcp}
	end

	def set_network(network_info)
		return false if(@path == "")  # in the case of windows

		@ipaddr = network_info['ipaddr']
		@netmask = network_info['netmask']
		@gateway = network_info['gateway']
		@dns = network_info['dns']

		@wifi = network_info['wifi'] if(network_info['wifi'] != nil)
		if(@wifi == 'true' || @wifi == true)
			@wifi = true
		else
			@wifi = false
		end

		@dhcp = network_info['dhcp'] if(network_info['dhcp'] != nil)
		if(@dhcp == 'true' || @dhcp == true)
			@dhcp = true
		else
			@dhcp = false
		end
		begin
			File.open(@path, "w") do |f|
				f.puts "hostname"
				f.puts "clientid"
				f.puts "persistent"
				f.puts "option rapid_commit"
				f.puts "option domain_name_servers, domain_name, domain_search, host_name"
				f.puts "option classless_static_routes"
				f.puts "option ntp_servers"
				f.puts "option interface_mtu"
				f.puts "require dhcp_server_identifier"
				f.puts "slaac private"

				if(@dhcp == 'false' || @dhcp == false)
					if(@wifi == 'true' || @wifi == true)
						f.puts "interface wlan0"
					else
						f.puts "interface eth0"
					end

					f.puts "static ip_address=#{@ipaddr}/#{make_bits(@netmask)}"
					f.puts "static routers=#{@gateway}"
					f.puts "static domain_name_servers=#{@dns}"
				end

				if(@wifi == 'true' || @wifi == true)
					system('sudo iwconfig wlan0 txpower auto;sudo iwconfig wlan0 txpower auto')
				else
					system('sudo iwconfig wlan0 txpower off')
				end

			end
		rescue
			return false
		end
		return true
	end

	def make_mask(bits)
		mask = ""
		4.times do
			mask = mask + "." if mask.length > 0
			if bits >= 8
				mask = mask + @mask_array[8]
			elsif bits <= 0
				mask = mask + @mask_array[0]
			else
				mask = mask + @mask_array[bits]
			end
			bits = bits - 8
		end
		return mask
	end

	def make_bits(mask)
		part = mask.split(".")
		bits = 0
		part.each do |p|
			bits = bits + @mask_array.index(p)
		end
		return bits
	end
end

#n = HostNetworkInfo.new
#puts n.get_network_info
#n.set_network("192.168.10.20", "255.255.255.0", "192.168.10.1", "61.122.241.180")
#puts n.get_network_info
