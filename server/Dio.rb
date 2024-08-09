#coding: utf-8

require_relative 'ManagementPoint'

class Di < ManagementPoint
	def initialize(pid, dev_id)
		super
		@icon = 'DIO.png'
		# status
		@stat = nil

		@start_time = nil
		@op_time = 0
		@on_times = 0
		@inv = false	# true then on/off status will be invert at management point
		@alert = false # true then signal will be alert 
		@off_delay_time = 0 #min

		@off_delay_command = [nil,{id=>[{'stat'=>'foff'},'off_delay','system']}] 	# [time, command]

		@parentp = nil
	end

	attr_reader :stat
	attr_accessor :optime, :on_times

	def point_type
		'Di'
	end

	def attribute
		super.merge({'inv'=>@inv,'alert'=>@alert,'offdelay'=>@off_delay_time})
	end

	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'inv'
				@inv = val
			when 'alert'
				@alert = val
			when 'offdelay'
				@off_delay_time = val
			end
		end		
	end

	def get_snapshot
		super.merge({'stat'=>@stat})
	end

	# get_status relate method
	def current_status
		return super.merge({'stat'=>@stat}) if(@alert == false)
		stat = false
		stat = true if(@stat == 'on')
		return super.merge({'error'=>stat})
	end

	# this method is used only for foff
	def check_stat(val,com,stat)
		stat['stat'] = val if(val != @stat && val == 'foff')
	end

	# update_status relate method
	def update_maintenance(val,cos,time)
		if(@ready and @maintenance)
			cos['maintenance'] = false 
			start_count(time) if(@stat == 'on')
		end
		@maintenance = false
	end
	def update_statv(val,cos,time)
		@parentp = $data_man.point_list[@parent] if(@parentp == nil)
		if(@inv)
			ival = 'off'
			ival = 'on' if(val == 'off')
			val = ival
		end
		if(@stat != val)
			if(@alert == false)
				@parentp.update_statp(val,self.id) if(@parentp != nil)

				if(@ready)
					cos['stat'] = val if(@children == nil)
					if(val == 'on')
						start_count(time)	if(time != nil)
						@on_times += 1
						if(@notification)
							cos['notify'] = 'alert_detect'
						end
					elsif(val == 'off')
						if(@stat != nil && @off_delay_time > 0)
							# set off delay command is foff
							@off_delay_command[0] = time+@off_delay_time*60
#							puts "Set Off Dlay #{@off_delay_command} **********************"
							@clock.add_action(@off_delay_command[0].hour,@off_delay_command[0].min,@off_delay_command[1],'offdelay')
							# delete 'stat' from cos
							cos.delete('stat')
							# return skip following process to ignore off
							return
						end
						stop_count(time) if(time != nil)
					elsif(val == 'foff')
						stop_count(time) if(time != nil)
						cos['stat'] = 'off'
					end
				end
			else
				@parentp.update_statp(err,self.id) if(@parentp != nil)
				if(@ready)
					err = false
					err = true if(val == 'on')
					cos['error'] = err if(@children == nil)
				end
			end
		elsif(val == 'on' && @off_delay_time > 0 && @off_delay_command[0] != nil) # if off delay is set
			# clear off delay
#			puts "Cancel Off Dlay #{@off_delay_command} **********************"
			@clock.cancel_action(@off_delay_command[0].hour,@off_delay_command[0].min,@off_delay_command[1],'offdelay')
		end
		@stat = val
	end

	def update_off_delay(val,cos)
		cos['off_delay'] = val if(@ready and @off_delay != val)
		@off_delay = val
	end

	def check_off_delay(val,com,stat)
		stat['off_delay'] = val
	end

	def start_count(time)
		@start_time = time
	end
	def start_count_if_on(time)
		@start_time = time if(@stat == 'on')
	end

	def stop_count(time)
		@op_time += (time-@start_time) if(@start_time != nil)
		@op_time = 900 if(@op_time >= 900)	# to prevent to exeed max time
		@start_time = nil
	end

	def restart_count(time)
		stop_count(time)
		start_count_if_on(time)
	end

	def store_running_data(time,db)
		restart_count(time)

		# add data to database
		db.add_optime(id,time,@op_time)
		db.add_ontimes(id,time,@on_times)
		# clear accumulated value
		@op_time = 0
		@on_times = 0
	end	
end

class Dio < Di
	def initialize(pid, dev_id)
		super
		@manual_op_cap = true
		@mode = 'msw' # or 'std' this is switch mode for Di integration
		@comstat = nil

		# output
		@repeat = false
		@rep_duration = 1
		@off_timer = 'off'
		@off_duration = 60
		@off_timer_command = [nil,{id=>[{'stat'=>'off'},'off_timer','system']}] 	# [time, command]

		@on_proh = false
	end

	def point_type
		'Dio'
	end
	
	def attribute
		super.merge({'manual_op_cap'=>@manual_op_cap,'mode'=>@mode})
	end

	def current_status
		super.merge({'repeat'=>@repeat,'rep_duration'=>@rep_duration,'off_timer'=>@off_timer,'off_duration'=>@off_duration,'on_proh'=>@on_proh})
	end

	def get_snapshot
		super.merge({'repeat'=>@repeat,'rep_duration'=>@rep_duration,'off_timer'=>@off_timer,'off_duration'=>@off_duration,'on_proh'=>@on_proh})
	end

	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'manual_op_cap'
				@manual_op_cap = val
			when 'mode'
				@mode = val
			end
		end		
	end

	# operation relate method
	def check_stat(val,com,stat)
		return if(@on_proh == true and val == 'on')
		if(@children != nil)
			if(@mode == 'msw')
				# just flip current Do status
				return if(@stat == val)
				com['stat'] = 'on' if(@comstat == 'off')
				com['stat'] = 'off' if(@comstat == 'on')
			else # std
				com['stat'] = val if(val != @stat)
			end
		else
			com['stat'] = val #if(val != @stat)
		end
	end
	def check_off_timer(val,com,stat)
		#puts "off timer #{val} #{@off_timer}"
		stat['off_timer'] = val #if(val != @off_timer)
	end
	def check_off_duration(val,com,stat)
		stat['off_duration'] = val #if(val != @off_duration)
	end
	def check_repeat(val,com,stat)
		stat['repeat'] = val #if(val != @repeat)
	end
	def check_rep_duration(val,com,stat)
		stat['rep_duration'] = val #if(val != @rep_duration)
	end
	def check_on_prohibition(val,com,stat)
		stat['on_proh'] = val #if(val != @on_proh)
	end

	def update_statv(val,cos,time)
		@comstat = val
		super if(@children == nil)
	end

	# update from child Di
	def update_statp(val,id)
		return if(val == @stat)
    cos = {}
    if(val.class == String)
	    cos['stat'] = val 
	  else
	  	cos['error'] = val
	  end
	  @stat = val
    $data_man.comm_man.cos(self.id,cos) if(@ready)
	end

	# update_status relate method
	def update_off_timer(val,cos)
		update = false
		(cos['off_timer'] = val; update = true) if(@ready and @off_timer != val)
		@off_timer = val
		return update
	end
	def update_off_duration(val,cos)
		update = false
		(cos['off_duration'] = val; update = true) if(@ready and @off_duration != val)
		@off_duration = val
		return update
	end
	def update_repeat(val,cos)
		update = false
		(cos['repeat'] = val; update = true) if(@ready and @repeat != val)
		@repeat = val
		return update
	end
	def update_rep_duration(val,cos)
		update = false
		(cos['rep_duration'] = val; update = true) if(@ready and @rep_duration != val)
		@rep_duration = val
		return update
	end
	def update_on_prohibition(val,cos)
		update = false
		(cos['on_proh'] = val; update = true) if(@ready and @on_proh != val)
		@on_proh = val
		return update
	end

	def operate_by_cos(cos)
		command = super(cos)
		command['stat'] = 'off' if(@on_proh == true and cos['stat'] == 'on')
		return command
	end

	def set_init_status(status)
		super
		status.each do |key, val|
			case key
			when 'off_timer'
				# off timer does not store when the system is rebooted
				#@off_timer = val
			when 'off_duration'
				@off_duration = val
			when 'repeat'
				@repeat = val
			when 'rep_duration'
				@rep_duration = val
			end
		end
	end

	def set_off_timer(cos,time)
		# if off timer is turn off or unit is turn off or off duration is changed then off command in timer should be clear
		stat = @stat
		if(@ready == true and @off_timer_command[0] != nil and ((@off_timer == 'on' and cos['stat'] == 'off') or (stat == 'on' and cos['off_timer'] == 'off') or (@off_timer == 'on' and stat == 'on' and cos['off_duration'] != nil)))
			@clock.cancel_action(@off_timer_command[0].hour,@off_timer_command[0].min,@off_timer_command[1],'offtimer') 
		end

		# if off timer turn on and unit is on then set off command in timer
		# if off timer is on and unit is turn on then set off command in timer
		# if off duration is changed then re-set off command
		# if sb_stat is on then off timer will not set
		puts "check sb stat #{@sb_stat} #{cos}" if(cos['sb_stat'] != nil)
		if(@sb_stat != 'on' and ((cos['off_timer'] == 'on' and (cos['stat'] == 'on' or stat == 'on')) or (cos['stat'] == 'on' and @off_timer == 'on') or (stat == 'on' and @off_timer == 'on' and cos['off_duration'] != nil) or (@ready == false and @off_timer == 'on' and stat == 'on') or (cos['sb_stat'] == 'off' and stat == 'on' and @off_timer == 'on')))
			puts "Set off timer by #{cos}"
			@off_timer_command[0] = time+@off_duration*60
			@clock.add_action(@off_timer_command[0].hour,@off_timer_command[0].min, @off_timer_command[1],'offtimer') 
		end
	end
end

