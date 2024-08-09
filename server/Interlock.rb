#coding: utf-8

require 'json'
#require_relative 'DataManager'


#@interlock = JSON.parse(File.read('c:\inetpub\wwwroot\SVMPC3\server\interlock.json'))

#output condition states "notDetected/atLeastOneInputValid/allInputsValid/atLeastOneInputInvalid/allInputsInvalid"

#"maintenance"=>false, "com_stat"=>true, "error"=>false, "alarm"=>false, "err_code"=>"", "stat"=>"off", "repeat"=>false, "rep_duration"=>1, "off_timer"=>"off", "off_duration"=>60, "on_proh"=>false, "forced_off"=>false, "sp_mode"=>"single", "csp"=>22.0, "hsp"=>22.0, "csp_limit_valid"=>false, "csp_l"=>16, "csp_h"=>32, "hsp_limit_valid"=>false, "hsp_l"=>16, "hsp_h"=>32, "csp_sb"=>nil, "hsp_sb"=>nil, "sb_stat"=>"off", "ch_master"=>true, "mode"=>"cool", "actual_mode"=>"cool", "fanstep"=>"L", "flap"=>0, "filter"=>false, "th_stat"=>nil, "defrost"=>nil, "thermo_err"=>false, "temp"=>21.4, "temp_avail"=>true, "rc_proh_stat"=>nil, "rc_proh_sp"=>nil, "rc_proh_mode"=>nil

#"maintenance"=>false, "com_stat"=>true, "error"=>false, "alarm"=>false, "err_code"=>"", "stat"=>"off", 
#"repeat"=>false, "rep_duration"=>1, "off_timer"=>"off", "off_duration"=>60, "on_proh"=>false, "forced_off"=>false, 
#"sp_mode"=>"single", "csp"=>22.0, "hsp"=>22.0, "csp_limit_valid"=>false, "csp_l"=>16, "csp_h"=>32, "hsp_limit_valid"=>false, 
#"hsp_l"=>16, "hsp_h"=>32, "csp_sb"=>nil, "hsp_sb"=>nil, "sb_stat"=>"off", "ch_master"=>true, "mode"=>"cool", 
#"actual_mode"=>"cool", "fanstep"=>"L", "flap"=>0, "filter"=>false, "th_stat"=>nil, "defrost"=>nil, "thermo_err"=>false, 
#"temp"=>21.4, "temp_avail"=>true, "rc_proh_stat"=>nil, "rc_proh_sp"=>nil, "rc_proh_mode"=>nil

#"error"=>false, "alarm"=>false, "temp"=>21.4, "stat"=>"off", "mode"=>"cool"
#true/false		true/false	 analog value(16c-32c)	on/off	 cool/heat/fan/dry

#"fanstep"=>"L", "flap"=>"0", "sp"=>"24", ""stat"=>"off", "mode"=>"cool"
# L/M/H		  0/1/2/3/4/swing  analog value  on/off		  cool/heat/fan/dry

# interlock data format
# {id:{interlock program},...,'next_id':id}

class Interlock

	def initialize(data_man)
		@lastIFexecuted = nil
		
		@point = nil		
		@cos = nil			
		@interlock = {}
		
		@cos_received = []	

		@interlock_file = 'interlock.json'
		
		@data_man = data_man
		
		if(File.exist?(@interlock_file))
			@interlock = @data_man.get_file(@interlock_file)
			if(@interlock != nil && @interlock['interlock'] != nil) # old file
				@interlock = convert(@interlock)	# convert to new format
				@data_man.save_file(@interlock_file,@interlock)
			end
			@interlock = {} if(@interlock == nil)
		end	
	end
	
	def convert(interlocks) 
		new_data = {}
		interlocks['interlock'].each do |interlock|
			id = generate_id
			new_data.update({id=>interlock})
		end
		new_data['next_id'] = interlocks['next_id']
		return new_data
	end

	# id: inl-00000
	def generate_id
		@interlock['next_id'] = 0 if(@interlock['next_id'] == nil)
		num = @interlock['next_id']
		@interlock['next_id'] += 1
		return "inl-#{sprintf("%05d",num)}"
	end

	# interlock enbale/disable control
	def set_enable(id,enable)
		puts "SET_ENABLE INTERLOCK #{id} #{enable}"
		return if(enable == nil)
		return if(enable != true && enable != false)
		@interlock[id]['enable'] = enable
		@data_man.save_file(@interlock_file,@interlock)
	end

	#interface for UI #@interlock
	def add_new_interlock(name, owner, program) 										#to add new interlock(name of interlock, name of owner, interlock function programming)
		return false if(owner != 'admin')
		@interlock.update({generate_id=>program})
		@data_man.save_file(@interlock_file,@interlock)
		return true
	end

	def save_interlock(id,owner,program)
		return false if(owner != 'admin')
		@interlock.update({id=>program})
		@data_man.save_file(@interlock_file,@interlock)
		return true
	end

	def delete_interlock(id,owner)						
		return false if(owner != 'admin')
		return false if(@interlock == nil)
		return false if(@interlock[id] == nil)
		@interlock.delete(id)
		@data_man.save_file(@interlock_file,@interlock)
		return true
	end

	def rename_interlock(id, newname, owner) 											#to rename interlock
		return false if(owner != 'admin')
		return false if(@interlock == nil)
		return false if(@interlock[id] == nil)
		@interlock[id]['name'] = newname
		@data_man.save_file(@interlock_file,@interlock)
		return true
	end	
	
	def get_interlock(owner)
		return false if(owner != 'admin')
		interlock = @interlock.clone
		interlock.delete('next_id')
		return interlock
	end
	
#########################################################
# interlock logic 
	def check(point,cos)
		return if(@interlock.nil? || @interlock.empty?)

		Thread.new do
			@point = point
			@cos = cos

			@interlock.each do |id,interlock|											#loop according to number of interlocks
				next if(id == 'next_id')
				if(interlock['enable'] == 'true' || interlock['enable'] == true)					
					for i in 1..2 do													#loop twice for output1 and output2
						output = "output#{i}"
						setFlag = check_input(interlock,output,@cos)					#check for output#{i} condition
						
						if(setFlag == true)												#run output#{i} command if true
							puts "Interlock #{output} triggered!"	
							timer = "timer#{i}"
							run_output(interlock[output],interlock[timer],interlock['name'])				
						else	
							puts 'No interlock triggered...'							#only for dev/test, once live to remove
						end
					end						
				end	
			end
		end
	end


	def check_input(interlock,output,cos)
		setFlag = false
		
		interlock['input'].each do |input|												#loop according to number of inputs	
			if(input['id'] == @point)													#check if COS point is the same as interlock input point
				setFlag = true
				break
			end	
		end
					
		if(setFlag == false)
			return setFlag
		else			
			setFlag = false
			
			interlock['input'].each do |input|											#loop according to number of inputs in the interlock, all input condition must meet			
				cStatus = @data_man.check_point_status(input['id']) 					#return cStatus (current status), contains all status of pointID			
				
				if(interlock[output]['condition'] == 'notDetected')
					return false
				else
					if(interlock[output]['condition'] == 'allInputsValid')
						input['detectCondition'].each do |key,value|
							if(key == 'temp' || key == 'av')
								if(check_range(cStatus[key],value) == true)
									setFlag = true
								else
									return false
								end	
							else
								if(value == cStatus[key])								#check if input condition key=>value is the same as point current point key=>value
									setFlag = true	
								else
									return false
								end
							end	
						end	
					elsif(interlock[output]['condition'] == 'allInputsInvalid')
						input['detectCondition'].each do |key,value|
							if(key == 'temp' || key == 'av')
								if(check_range(cStatus[key],value) != true)
									setFlag = true
								else
									return false
								end	
							else
								if(value != cStatus[key])								#check if input condition key=>value is not the same as point current point key=>value
									setFlag = true	
								else
									return false
								end
							end	
						end	
					elsif(interlock[output]['condition'] == 'atLeastOneInputValid')
						input['detectCondition'].each do |key,value|
							if(key == cos.keys.first && value == cos[key])				#only activate if COS is started by points in INPUT and matches INPUT status(Only applicable to 'atLeastOneInputValid')
								if(key == 'temp' || key == 'av')
									if(check_range(cStatus[key],value) == true)
										setFlag = true
									else
										setFlag = false
										break
									end	
								else
									if(value == cStatus[key])							#check if input condition key=>value is the same as point current point key=>value
										setFlag = true	
									else
										setFlag = false
										break
									end
								end
							else
								setFlag = false
							end	
						end	
						
						if(setFlag == true)
							return true
						end						
					elsif(interlock[output]['condition'] == 'atLeastOneInputInvalid')
						input['detectCondition'].each do |key,value|
							if(key == cos.keys.first && value != cos[key])				#only activate if COS is started by points in INPUT and does not match INPUT status(Only applicable to 'atLeastOneInputInvalid')
								if(key == 'temp' || key == 'av')
									if(check_range(cStatus[key],value) != true)
										setFlag = true
									else
										setFlag = false
										break
									end	
								else
									if(value != cStatus[key])							#check if input condition key=>value is not the same as point current point key=>value
										setFlag = true	
									else
										setFlag = false
										break
									end
								end	
							else
								setFlag = false
							end
						end	
						
						if(setFlag == true)
							return true
						end
					else
						return false
					end
				end
			end	
		end	
		
		return setFlag
	end
	
	def check_range(checknum,range)
		if(range.include?("to") == true)												# ##.#to##.#
			limit = range.split('to',2)													#limit[0] is lower limit, limit[1] is higher limit
			
			if(limit[0].to_i < checknum.to_i)
				return checknum.to_i < limit[1].to_i
			else
				return false
			end				
		elsif(range.include?("<") == true)					
			return checknum.to_i < range[1..-1].to_i
		elsif(range.include?(">") == true)
			return checknum.to_i > range[1..-1].to_i
		else
			return false
		end
	end

	def run_output(interlock,timer,name)
		#to check if thread exist first START
		if(timer != 0)																	#only run Thread kill if timer(delay) exist
			Thread.list.each do |t|
				if(t['name'] == interlock) 
					Thread.kill(t)
				end
			end
		end			
		#to check if thread exist first END
	
		Thread.new do
			Thread.current['name'] = interlock											#give each thread an identifier
		
			timer = timer.to_i * 60														#timer is in minutes, sleep process in seconds
			sleep(timer) if(timer != 0)
						
			interlock['controls'].each do |controls|									#loop according to number of controls in output
				controls['command'].each do |key,value|					
					if(key == 'scene')		
						@data_man.run_scenes(value, 'admin')							#Interlock might be triggered by Interlock with no user login.
					else
						commands = Hash.new
						commands[key] = value 

						@data_man.operate(controls['id'],commands,'interlock',name)
					end	
				end
			end
		end
	end
end 	