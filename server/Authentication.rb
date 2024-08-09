# coding: utf-8

require 'socket'
require 'net/http'
require 'macaddr'

class Authentication
	def initialize(country, product, version)
		begin
			File::open('.auth_server') {|f|
				@url = f.gets.strip
				@port = f.gets.to_i
				@proxy = f.gets.strip
				@prx_port = f.gets.to_i
				@proxy = nil if(@proxy == '')
			}
		rescue
			@url = 'activation.ddns.net'
			@port = 80
			@proxy = nil
			@prx_port = 80
		end
		@country = country
		@product = product
		@version = version
		@macaddr = macaddr
		@key = calc_key
		puts @key
	end

	attr_reader :macaddr

	def start
		loop {
			break if check
#			Kernel.exit if(Time.now > Time.new(2017,5,27))
			break if connection(@url, @port, @proxy, @prx_port)
			sleep 10
		}
		@country
	end

	def check
		begin
			File.open('.auth') do |f|
				key = f.gets.strip
				puts key
				puts @key
				return false if(key == nil || key.empty?)
				return true if key == @key
				exit
			end
		rescue
			# no .auth file
			return false
		end
	end

	def calc_key
		mac = macaddr.split(':')
		mac = macaddr.split('-') if(mac.length == 1)
		key = 0
		mac.each do |i|
			key = key+i.hex
		end
		key.to_s(16)
	end

	def connection(url, port, proxy, prx_port)
#		if(Time.now >= Time.new(2017,4,1))
#			puts "Expired"
#			return false
#		end
		begin
			req = Net::HTTP::Post.new("/AuthServer/svm_auth.rb")
			req.set_form_data({'country'=>@country,'product'=>@product,'version'=>@version,'macaddr'=>@macaddr})

			proxy = Net::HTTP::Proxy(proxy,prx_port)
#			puts proxy
			http = proxy.new(url, port)
			ans = http.request(req)
#			puts ans.code
#			puts ans.body
			return false if(ans.code != '200')
			return false if(ans.body.index('NG') != nil)
			return false if(ans.body.strip != @key)
			generate_auth_file(@key)
			# for raspbian RTC
#			`sudo /sbin/hwclock -w`
			return true
		rescue => e
			puts "Activation error: #{e}"
		end
		return false
	end

	def generate_auth_file(key)
		begin
			File.write('.auth', key)
		rescue
		end
	end

	def macaddr
		if(RUBY_PLATFORM.index("linux"))
			sock = Socket.getifaddrs.select {|x| x.name == 'eth0'}[0]
			mac = sock.addr.to_s.unpack('C*')[-6,6]
			"#{mac[0].to_s(16)}:#{mac[1].to_s(16)}:#{mac[2].to_s(16)}:#{mac[3].to_s(16)}:#{mac[4].to_s(16)}:#{mac[5].to_s(16)}"
		else
			return Mac.addr
		end
	end
end
