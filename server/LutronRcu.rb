require 'net/telnet'
require_relative 'Device'

class LutronRcu < Device
	def initialize(id, data_man) 
		super
		@timeout = 2
		@ipaddr = '192.168.1.2'
		@port = 23
		@user = ''
		@passwd = ''
		@thermo = []	# Thermostat and FCU info {'dev'=>device_number,'pid'=>pid,'sb'=>true/false} if sb is true then stop fan, false then fan during unocc
		@thermo_stat = {}	# device_number=>{'pid'=>pid, 'sb'=>sb, 'stat'=>auto/off, 'sp'=>sp, 'driftP'=>drift+, 'driftM'=>drift-, 'fan'=>fanstep}
		@fcu_stat = {} # pid=>{'dev'=>device_number, 'sb'=>sb, 'stat'=>on/off, 'sp'=>sp, 'fan'=>fanstep}
		@feedback = Queue.new

		@startup = false

		# command send time to check timeout
		@sp_time = nil
		@stat_time = nil
		@fan_time = nil
	end

	def key
		'lut'
	end

	def device_attr
		{'ip_addr'=>@ipaddr,'port'=>@port,'user'=>@user,'passwd'=>@passwd,'attr'=>@thermo}
	end

	def set_attribute(attr)
		@ipaddr = attr['ip_addr'] if(attr['ip_addr'] != nil)
		@port = attr['port'] if(attr['port'] != nil)
		@user = attr['user'] if(attr['user'] != nil)
		@passwd = attr['passwd'] if(attr['passwd'] != nil)
		@thermo = attr['attr'] if(attr['attr'] != nil)
	end

	def changed?(attr)
		return true if(@ipaddr != attr['ip_addr'])
		return true if(@port != attr['port'])
		return true if(@user != attr['user'])
		return true if(@passwd != attr['passwd'])
		return true if(@thermo != attr['attr'])
		return false
	end

	def connect
		puts "Lutron RCU connected"
		# make stat data structure before connection
		make_data

		# get and update thermostat status 
		th = Thread.new do
			sleep 5
			listen
		end
	end

	# change thermostat setting based on other operation
	def feedback(pid, cos)
		return if(@startup == false)
		return if(@fcu_stat[pid] == nil)
		return if(cos['temp'] == nil)

		# send room temperature to Lutron thermostat
		@feedback.push("#HVAC,#{@fcu_stat[pid]['dev']},15,#{cos['temp']}")
		
	end

	# generate status info from connection information for both thermonstat and FCU
	def make_data
		@thermo.each do |th|
			dev = th['dev']
			pid = th['pid']
			sb = th['sb']
			next if(pid == nil)
			@thermo_stat[dev] = {'pid'=>pid, 'sb'=>sb, 'stat'=>nil, 'sp'=>nil,'driftP'=>nil, 'driftM'=>nil, 'fan'=>nil}
			@fcu_stat[pid] = {'dev'=>dev, 'sb'=>sb, 'stat'=>nil, 'sp'=>nil, 'fan'=>nil, 'sb_c'=>nil, 'sb_h'=>nil}
		end
	end

	def listen
		loop do
			puts "START LISTENING"
			begin
				@host = Net::Telnet.new('Host'=>@ipaddr, 'Port'=>@port, 'Timeout'=>@timeout)
				@host.login(@user,@passwd)
				# stop monitoring
				@host.cmd("#MONITORING,255,2")
				# room temp initialization
				@thermo.each do |dev|
					point = @data_man.point_list[dev['pid']]
					rt = 24
					rt = point.current_status['temp'] if(point != nil)
					@host.cmd("#HVAC,#{dev['dev']},15,#{rt}")	# initialize thermostat
				end

				# get current status of each Thermostat
				puts "SEND INITIAL STATUS OF THERMOSTAT"
				loop do
					@thermo_stat.each do |dev,info|
						# get current status
						point = @data_man.point_list[info['pid']]
						stat = point.current_status if(point != nil)
#						puts "STAT #{stat}"
#						print "1"
						# update check the difference between stat and current thermostat stat
						ret = @host.cmd("?HVAC,#{dev},19")
#						puts "#{ret}"
#						print "."
						update(ret,stat)	# setpoint
#						print "2"
						ret = @host.cmd("?HVAC,#{dev},3")
#						print "."
						update(ret,stat)		# status
#						print "3"
						ret = @host.cmd("?HVAC,#{dev},4")
#						print "."
						update(ret,stat)		# fan step
#						print "|"
						# update room temp to thermostat
						while(@feedback.empty? == false)
							@host.cmd(@feedback.pop) 
						end
					end
					@startup = true
					sleep 1
				end
			rescue => e
				@startup = false
				puts "Error: #{e}"
#				puts "#{e.backtrace}"
				sleep 10	# wait for next connection
			end
		end
	end

	def update(data,fcu)
		lines = data.split("\n")
		lines.each do |line|
			op_com = {}
			info = line.split(",")
			next if(info[0] != "~HVAC")
			dev = info[1].to_i
			com = info[2].to_i
			next if(@thermo_stat[dev] == nil)
			# device_number=>{'pid'=>pid, 'sb'=>sb, 'stat'=>auto(4)/off(1), 'sp'=>sp, 'driftP'=>drift+, 'driftM'=>drift-, 'fan'=>fanstep(auto(1)/no fan(4)/H(5)/M(6)/L(7))}
			# make operation command from updated info
			if(com == 19)	# setpoint
				sp = info[3].to_f
				driftM = info[4].to_f
				driftP = info[5].to_f
				# when thermostat is operated
				if(sp != @thermo_stat[dev]['sp'] || driftM != @thermo_stat[dev]['driftM'] || driftP != @thermo_stat[dev]['driftP'])
					@sp_time = Time.now
					if(@thermo_stat[dev]['stat'] == 1)	# thermo stat operation is off
						op_com['sp'] = conv_sp(sp)	# jsut change sp and no setback
						op_com['csp_sb'] = nil
						op_com['hsp_sb'] = nil
					# below condition is for thermostat operation is on
					elsif(driftM > 0 || driftP > 0)	
						if(@thermo_stat[dev]['sb'] == true) # setback operation request
							op_com['stat'] = 'off' if(fcu['sb_stat'] == 'off' && fcu['stat'] == 'on')
							op_com['sp'] = conv_sp(sp) if(sp != @thermo_stat[dev]['sp'])
							op_com['csp_sb'] = conv_sp(sp+driftP) if(sp != @thermo_stat[dev]['sp'] || driftP != @thermo_stat[dev]['driftP'])
							op_com['hsp_sb'] = conv_sp(sp-driftM) if(sp != @thermo_stat[dev]['sp'] || driftM != @thermo_stat[dev]['driftM'])
						else	# setpoint change request
							op_com['stat'] = 'on'
							op_com['csp'] = conv_sp(sp+driftP)
							op_com['hsp'] = conv_sp(sp-driftM)
							op_com['csp_sb'] = nil
							op_com['hsp_sb'] = nil					
						end
					else	# setpoint change
						op_com['stat'] = 'on' if(driftP != @thermo_stat[dev]['driftP'] || driftM != @thermo_stat[dev]['driftM'])
						op_com['csp'] = conv_sp(sp)
						op_com['hsp'] = conv_sp(sp)
						op_com['csp_sb'] = nil
						op_com['hsp_sb'] = nil					
					end
				elsif((conv_sp(sp) != fcu['csp'] || conv_sp(sp) != fcu['hsp']) && fcu['sb_stat'] == 'off' && (@sp_time != nil && Time.now-@sp_time > 20))
					log("#{fcu}")
					@sp_time = Time.now
					if(driftM > 0 || driftP > 0)
						op_com['stat'] = 'off'
						op_com['csp'] = conv_sp(sp)
						op_com['hsp'] = conv_sp(sp)
						op_com['csp_sb'] = conv_sp(sp+driftP)
						op_com['hsp_sb'] = conv_sp(sp-driftM)
					elsif(driftM == 0 && driftP == 0)
						op_com['csp'] = conv_sp(sp)
						op_com['hsp'] = conv_sp(sp)
						op_com['csp_sb'] = nil
						op_com['hsp_sb'] = nil
					end
				elsif((conv_sp(sp+driftP) != fcu['csp_sb'] || conv_sp(sp-driftM) != fcu['hsp_sb']) && fcu['sb_stat'] == 'on' && (@sp_time != nil && Time.now-@sp_time > 20))
					log("#{fcu}")
					@sp_time = Time.now
					op_com['stat'] = 'off'
					op_com['csp'] = conv_sp(sp)
					op_com['hsp'] = conv_sp(sp)
					op_com['csp_sb'] = conv_sp(sp+driftP)
					op_com['hsp_sb'] = conv_sp(sp-driftM)
				end
				@thermo_stat[dev].update({'sp'=>sp,'driftP'=>driftP,'driftM'=>driftM})
			elsif(com == 3) # status
				stat = info[3].to_i
				if(stat != @thermo_stat[dev]['stat'])
					@stat_time = Time.now
					op_com['stat'] = conv_stat(stat) 
					@thermo_stat[dev]['stat'] = stat
					# if drift is set then set setback
					if(stat == 4 && @thermo_stat[dev]['sb'] == true && (@thermo_stat[dev]['driftP'] > 0 || @thermo_stat[dev]['driftM'] > 0))
						op_com['stat'] = 'off'
						op_com['csp_sb'] = conv_sp(@thermo_stat[dev]['sp']+@thermo_stat[dev]['driftP'])
						op_com['hsp_sb'] = conv_sp(@thermo_stat[dev]['sp']-@thermo_stat[dev]['driftM'])
					elsif(stat == 1) # stop even under setback
						op_com['sp'] = @thermo_stat[dev]['sp']
						op_com['csp_sb'] = nil
						op_com['hsp_sb'] = nil
					end
				elsif(conv_stat(stat) != fcu['stat'] && fcu['csp_sb'] == nil && fcu['hsp_sb'] == nil && (@stat_time != nil && Time.now-@stat_time > 20))
					op_com['stat'] = conv_stat(stat) 
					log "FCU2 #{fcu}"
					log "UPDATE2 #{info}"
				end
			elsif(com == 4) # fan step
				step = info[3].to_i
				if(step != @thermo_stat[dev]['fan'])
					if((fanstep = conv_fan(step)) != nil)
						op_com['fanstep'] = fanstep 	
						@fan_time = Time.now
					end
					@thermo_stat[dev]['fan'] = step
				elsif(step != 4 && conv_fan(step) != fcu['fanstep'] && (@fan_time != nil && Time.now-@fan_time > 20))
					op_com['fanstep'] = conv_fan(step) 	
					@fan_time = Time.now
				end
			end
			if(op_com.empty? == false)
				log "UPDATE: #{info}"
				log "STAT: #{@thermo_stat[dev]}"
				log "COMMAND #{op_com}"
				# check if FCU stat should update
				pid = @thermo_stat[dev]['pid']
				@data_man.operate(pid,op_com,"LutronThermostat","") if(@data_man != nil)
			end
		end
	end


	def conv_stat(stat)
		return 'on' if(stat == 4)
		return 'off'
	end

	def conv_sp(sp)
		return 32 if(sp > 32)
		return 16 if(sp < 16)
		return sp.floor if(sp.to_s.split(".")[1].to_i == 22)
		return sp
	end

	def conv_fan(fan)
		return 'H' if(fan == 5)
		return 'M' if(fan == 6)
		return 'L' if(fan == 7)
		return 'auto' if(fan == 1)
		return nil
	end

	def log(msg)
		File.open("lutron.log","a") do |f|
			f.puts("#{Time.now.strftime("%H:%M:%S")}: #{msg}")
			puts "#{Time.now.strftime("%H:%M:%S")}: #{msg}"
		end
	end
end

#lutron = LutronThermo.new(1,nil)
#lutron.set_attribute({"ip_addr"=>"192.168.1.2","user"=>"admin","passwd"=>"admin1","attr"=>[{"dev"=>8,"pid"=>"001","sb"=>false}]})
#th = lutron.connect
#th.join