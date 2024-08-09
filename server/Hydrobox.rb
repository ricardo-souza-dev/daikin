# coding: utf-8

require_relative 'ManagementPoint'

class Hydrobox < ManagementPoint
	def initialize(pid, dev_id)
		super(pid, dev_id)
		# attribute of point
		@sp_cap = false
		@sp_step = 1
		@csp_range = [16,32]
		@hsp_range = [16,32]
		@mode_cap = 'H'
		@manual_op_cap = true
		@rc_master = true
		@rc_proh_cap = true
		@ac_op_cap = false
		@wsp_cap = false
		@wsp_step = 1
		@wcsp_range = [16,32]
		@whsp_range = [16,32]
		@wreh_cap = false
		@low_noize_cap = false

		# point status
		@maintenance = nil
		@stat = nil
		@th_stat = nil
		@forced_off = nil
		@defrost = nil
		@wreh_stat = nil
		@wstor_stat = nil
		@low_noize_stat = nil

		@sp_mode = 'single'
		@csp = nil
		@hsp = nil
		@csp_limit_valid = false
		@csp_limit = [nil,nil]
		@hsp_limit_valid = false
		@hsp_limit = [nil,nil]
		@setback = [nil,nil]
		@wcsp = nil
		@whsp = nil
		@wstor_sp = nil

		@ch_master = nil
		@mode = nil

		@temp = nil
		@temp_avail = nil

		@error = nil
		@alarm = nil
		@err_code = nil

		@rc_proh = [nil,nil,nil]

		@off_timer = 'off'
		@off_duration = 60

		# total value
		@cool_op_time = 0
		@heat_op_time = 0
		@th_on_time = 0
	end

	def point_type
		'Hydrobox'
	end
	
	def dispatch_operate(command,com,stat)
		command.each do |type, val|
			case type
			when 'maintenance'
				check_maintenance(val,com,stat)
			when 'stat'
				check_stat(val,com,stat)
			when 'sp_mode'
				check_sp_mode(val,com,stat)
			when 'csp'
				check_csp(val,command['mode'],com,stat)
			when 'hsp'
				check_hsp(val,command['mode'],com,stat)
			when 'csp_limit_valid'
				check_csp_limit_valid(val,com,stat)
			when 'csp_l'
				check_csp_l(val,com,stat)
			when 'csp_h'
				check_csp_h(val,com,stat)
			when 'hsp_limit_valid'
				check_hsp_limit_valid(val,com,stat)
			when 'hsp_l'
				check_hsp_l(val,com,stat)
			when 'hsp_h'
				check_hsp_h(val,com,stat)
			when 'csp_sb'
				check_csp_sb(val,com,stat)
			when 'hsp_sb'
				check_hsp_sb(val,com,stat)
			when 'wcsp'
				check_wcsp(val,command['mode'],com,stat)
			when 'whsp'
				check_whsp(val,command['mode'],com,stat)
			when 'wstor_sp'
				check_wstor_sp(val,com,stat)
			when 'mode'
				check_mode(val,com,stat)
			when 'rc_proh_stat'
				check_rc_proh_stat(val,com,stat)
			when 'rc_proh_sp'
				check_rc_proh_sp(val,com,stat)
			when 'rc_proh_mode'
				check_rc_proh_mode(val,com,stat)
			when 'off_timer'
				check_off_timer(val,com,stat)
			when 'off_duration'
				check_off_duration(val,com,stat)
			when 'wreh_stat'
				check_wreh_stat(val,com,stat)
			when 'low_noize_stat'
				check_low_noize_stat(val,com,stat)
			end
		end
	end

	# these method should be overwrite in sub class
	def check_stat(val,com,stat)
		com['stat'] = val #if(val != @stat)
	end
	def check_sp_mode(val,com,stat)
		return if(@sp_cap == false)
		stat['sp_mode'] = val #if(val != @sp_mode)
	end
	def check_csp(val,mode,com,stat)
		return if(@sp_cap == false)
		if(mode == 'cool' or mode == nil)
			com['sp'] = val #if(val != @csp)
		elsif(mode == 'heat' or mode == nil)
			stat['csp'] = val #if(val != @csp)
		end
	end
	def check_hsp(val,mode,com,stat)
		return if(@sp_cap == false)
		if(mode == 'heat' or mode == nil)
			com['sp'] = val #if(val != @hsp)
		elsif(mode == 'cool' or mode == nil)
			stat['hsp'] = val #if(val != @hsp)
		end
	end
	def check_csp_limit_valid(val,com,stat)
		com['csp_limit_valid'] = val #if(val != @csp_limit_valid)
	end
	def check_csp_l(val,com,stat)
		val = @csp_range[0] if(val < @csp_range[0])
		val = @csp_range[1] if(val > @csp_range[1])
		com['csp_l'] = val #if(val != @csp_limit[0])
	end
	def check_csp_h(val,com,stat)
		val = @csp_range[0] if(val < @csp_range[0])
		val = @csp_range[1] if(val > @csp_range[1])
		com['csp_h'] = val #if(val != @csp_limit[1])
	end
	def check_hsp_limit_valid(val,com,stat)
		com['hsp_limit_valid'] = val #if(val != @hsp_limit_valid)
	end
	def check_hsp_l(val,com,stat)
		val = @hsp_range[0] if(val < @hsp_range[0])
		val = @hsp_range[1] if(val > @hsp_range[1])
		com['hsp_l'] = val #if(val != @hsp_limit[0])
	end
	def check_hsp_h(val,com,stat)
		val = @hsp_range[0] if(val < @hsp_range[0])
		val = @hsp_range[1] if(val > @hsp_range[1])
		com['hsp_h'] = val #if(val != @hsp_limit[1])
	end
	def check_csp_sb(val,com,stat)
		stat['csp_sb'] = val #if(val != @csp_sb)
	end
	def check_hsp_sb(val,com,stat)
		stat['hsp_sb'] = val #if(val != @hsp_sb)
	end
	def check_wcsp(val,mode,com,stat)
		return if(@wsp_cap == false)
		stat['wcsp'] = val #if(val != @wcsp)
	end
	def check_whsp(val,mode,com,stat)
		return if(@wsp_cap == false)
		stat['whsp'] = val #if(val != @whsp)
	end
	def check_wstor_sp(val,com,stat)
		return if(@wreh_cap == false)
		stat['wstor_sp'] = val #if(val != @wstor_sp)
	end
	def check_mode(val,com,stat)
		return if(@mode_cap.index(val[0].upcase) == nil)
		com['mode'] = val #if(val != @mode)
	end
	def check_rc_proh_stat(val,com,stat)
		com['rc_proh_stat'] = val #if(val != @rc_proh[0])
	end
	def check_rc_proh_sp(val,com,stat)
		com['rc_proh_sp'] = val #if(val != @rc_proh[1])
	end
	def check_rc_proh_mode(val,com,stat)
		com['rc_proh_mode'] = val #if(val != @rc_proh[2])
	end
	def check_off_timer(val,com,stat)
		stat['off_timer'] = val #if(val != @off_timer)
	end
	def check_off_duration(val,com,stat)
		stat['off_duration'] = val #if(val != @off_duration)
	end
	def check_wreh_stat(val,com,stat)
		return if(@wreh_cap == false)
		stat['wreh_stat'] = val #if(val != @wreh_stat)
	end
	def check_low_noize_stat(val,com,stat)
		return if(@low_noize_cap == false)
		stat['low_noize_cap'] = val #if(val != @low_noize_cap)
	end

	def attribute
		{'ppd'=>@ppd_target,'sp_cap'=>@sp_cap,'sp_step'=>@sp_step,'csp_min'=>@csp_range[0],'csp_max'=>@csp_range[1],'hsp_min'=>@hsp_range[0],'hsp_max'=>@hsp_range[1],'mode_cap'=>@mode_cap,'ac_op_cap'=>@ac_op_cap,'wsp_cap'=>@wsp_cap,'wsp_step'=>@wsp_step,'wcsp_min'=>@wcsp_range[0],'wcsp_max'=>@wcsp_range[1],'whsp_min'=>@whsp_range[0],'whsp_max'=>@whsp_range[1],'wreh_cap'=>@wreh_cap,'low_noize_cap'=>@low_noize_cap,'manual_op_cap'=>@manual_op_cap,'rc_master'=>@rc_master,'rc_proh_cap'=>@rc_proh_cap}
	end

	def current_status
		{'maintenance'=>@maintenance,'com_stat'=>@com_stat,'stat'=>@stat,'forced_off'=>@forced_off,'wreh_stat'=>@wreh_stat,'wstor_stat'=>@wstor_stat,'low_noize_stat'=>@low_noize_stat,'sp_mode'=>@sp_mode,'csp'=>@csp,'hsp'=>@hsp,'csp_l'=>@csp_limit[0],'csp_h'=>@csp_limit[1],'hsp_l'=>@hsp_limit[0],'hsp_h'=>@hsp_limit[1],'csp_sb'=>@setback[0],'hsp_sb'=>@setback[1],'wcsp'=>@wcsp,'whsp'=>@whsp,'wstor_sp'=>@wstor_sp,'ch_master'=>@ch_master,'mode'=>@mode,'th_stat'=>@th_stat,'defrost'=>@defrost,'temp'=>@temp,'temp_avail'=>@temp_avail,'rc_proh_stat'=>@rc_proh[0],'rc_proh_sp'=>@rc_proh[1],'rc_proh_mode'=>@rc_proh[2],'off_timer'=>@off_timer,'off_duration'=>@off_duration,'error'=>@error,'alarm'=>@alarm,'err_code'=>@err_code}
	end

	def get_snapshot
		{'maintenance'=>@maintenance,'sp_mode'=>@sp_mode,'csp'=>@csp,'hsp'=>@hsp,'csp_l'=>@csp_limit[0],'csp_h'=>@csp_limit[1],'hsp_l'=>@hsp_limit[0],'hsp_h'=>@hsp_limit[1],'csp_sb'=>@setback[0],'hsp_sb'=>@setback[1],'off_timer'=>@off_timer,'off_duration'=>@off_duration,'cool_op_time'=>@cool_op_time,'heat_op_time'=>@heat_op_time,'th_on_time'=>@th_on_time}
	end

	# device layer method
	# point information update from device info
	# attr is hash
	def set_attr(attr)
		attr.each do |key, val|
			case key
			when 'ppd'
				@ppd_target = val
			when 'sp_cap'
				@sp_cap = val
			when 'sp_step'
				@sp_step = val
			when 'csp_min'
				@csp_range[0] = val
			when 'csp_max'
				@csp_range[1] = val
			when 'hsp_min'
				@hsp_range[0] = val
			when 'hsp_max'
				@hsp_range[1] = val
			when 'mode_cap'
				@mode_cap = val
			when 'ac_op_cap'
				@ac_op_cap = val
			when 'manual_op_cap'
				@manual_op_cap = val
			when 'rc_master'
				@rc_master = val
			when 'ac_op_cap'
				@ac_op_cap = val
			when 'wsp_cap'
				@wsp_cap = val
			when 'wsp_step'
				@wsp_step = val
			when 'wcsp_min'
				@wcsp_range[0] = val
			when 'wcsp_max'
				@wcsp_range[1] = val
			when 'whsp_min'
				@whsp_range[0] = val
			when 'whsp_max'
				@whsp_range[1] = val
			when 'wreh_cap'
				@wreh_cap = val
			when 'low_noize_cap'
				@low_noize_cap = val
			end
		end
	end

	# status update from device
	# status is hash
	def update_stat(status,cos,time,db)
		stat_update = false
		status.each do |key, val|
			case key
			when 'maintenance'
				if(@ready and @maintenance)
					cos['maintenance'] = false 
					start_count(time) if(@stat == 'on')
				end
				@maintenance = false
			when 'com_stat'
				cos['com_stat'] = true if(@ready and @com_stat == false)
				@com_stat = true
			when 'stat'
				if(@ready and @stat != val)
					cos['stat'] = val 
					if(val == 'on')
						start_count(time)
						@on_times += 1
					elsif(val == 'off')
						stop_count(time)
					end
				end
				@stat = val
			when 'forced_off'
				cos['forced_off'] = val if(@ready and @forced_off != val)
				@forced_off = val
			when 'sp_mode'
				(cos[key] = val; stat_update = true) if(@ready and @sp_mode != val)
				@sp_mode = val
			when 'sp'
				key = update_sp(val,status['mode'])
				(cos[key] = val; stat_update = true) if key != nil
			when 'csp'
				(cos['csp'] = val; stat_update=true) if(@ready and @csp != val)
				@csp = val
			when 'hsp'
				(cos['hsp'] = val; stat_update=true) if(@ready and @hsp != val)
				@hsp = val
			when 'csp_l'
				val = @csp_range[0] if(val < @csp_range[0])
				val = @csp_range[1] if(val > @csp_range[1])
				(cos['csp_l'] = val; stat_update = true) if(@ready and @csp_limit[0] != val)
				@csp_limit[0] = val
			when 'csp_h'
				val = @csp_range[0] if(val < @csp_range[0])
				val = @csp_range[1] if(val > @csp_range[1])
				(cos['csp_h'] = val; stat_update = true) if(@ready and @csp_limit[1] != val)
				@csp_limit[1] = val
			when 'hsp_l'
				val = @hsp_range[0] if(val < @hsp_range[0])
				val = @hsp_range[1] if(val > @hsp_range[1])
				(cos['hsp_l'] = val; stat_update = true) if(@ready and @hsp_limit[0] != val)
				@hsp_limit[0] = val
			when 'hsp_h'
				val = @hsp_range[0] if(val < @hsp_range[0])
				val = @hsp_range[1] if(val > @hsp_range[1])
				(cos['hsp_h'] = val; stat_update = true) if(@ready and @hsp_limit[1] != val)
				@hsp_limit[1] = val
			when 'csp_sb'
				(cos['csp_sb'] = val; stat_update = true) if(@ready and @setback[0] != val)
				@setback[0] = val
			when 'hsp_sb'
				(cos['hsp_sb'] = val; stat_update = true) if(@ready and @setback[1] != val)
				@setback[1] = val
			when 'ch_master'
				cos['ch_master'] = val if(@ready and @ch_master != val)
				@ch_master = val
			when 'mode'
				if(@ready and @mode != val)
					cos['mode'] = val 
					restart_count(time)
				end
				@mode = val
			when 'th_stat'
				if(@ready and @th_stat != val)
					cos['th_stat'] = val 
					th_start_count(time) if(val == 'on')
					th_stop_count(time) if(val == 'off')
				end
				@th_stat = val
			when 'defrost'
				cos['defrost'] = val if(@ready and @defrost != val)
				@defrost = val
			when 'temp'
				cos['temp'] = val if(@ready and @temp != val)
				@temp = val
			when 'temp_avail'
				cos['temp_avail'] = val if(@ready and @temp_avail != val)
				@temp_avail = val
			when 'rc_proh_stat'
				cos['rc_proh_stat'] = val if(@ready and @rc_proh[0] != val)
				@rc_proh[0] = val
			when 'rc_proh_sp'
				cos['rc_proh_sp'] = val if(@ready and @rc_proh[1] != val)
				@rc_proh[1] = val
			when 'rc_proh_mode'
				cos['rc_proh_mode'] = val if(@ready and @rc_proh[2] != val)
				@rc_proh[2] = val
			when 'off_timer'
				(cos['off_timer'] = val; stat_update = true) if(@ready and @off_timer != val)
				@off_timer = val
			when 'off_duration'
				(cos['off_duration'] = val; stat_update = true) if(@ready and @off_duration != val)
				@off_duration = val
			when 'error'
				cos['error'] = val if(@ready and @error != val)
				@error = val
			when 'alarm'
				cos['alarm'] = val if(@ready and @alarm != val)
				@alarm = val
			when 'err_code'
				cos['err_code'] = val if(@ready and @err_code != val)
				@err_code = val
			when 'wreh_stat'
				cos['wreh_stat'] = val if(@ready and @wreh_stat != val)
				@wreh_stat = val
			when 'wstor_stat'
				cos['wstor_stat'] = val if(@ready and @wstor_stat != val)
				@wstor_stat =val
			when 'low_noize_stat'
				cos['low_noize_stat'] = val if(@ready and @low_noze_stat != val)
				@low_noize_stat = val
			when 'wcsp'
				cos['wcsp'] = val if(@ready and @wcsp != val)
				@wcsp = val
			when 'whsp'
				cos['whsp'] = val if(@ready and @whsp != val)
				@whsp = val
			when 'wstor_sp'
				cos['wsotr_sp'] = val if(@ready and @wstor_sp != val)
				@wstor_sp = val
			end
		end
		check_limitation
		db.update_status(id,get_snapshot) if(stat_update == true)
	end

	def set_init_status(status)
		status.each do |key, val|
			case key
			when 'maintenance'
				@maintenance = val
			when 'sp_mode'
				@sp_mode = val
			when 'csp'
				@csp = val
			when 'hsp'
				@hsp = val
			when 'csp_l'
				@csp_limit[0] = val
			when 'csp_h'
				@csp_limit[1] = val
			when 'hsp_l'
				@hsp_limit[0] = val
			when 'hsp_h'
				@hsp_limit[1] = val
			when 'csp_sb'
				@setback[0] = val
			when 'hsp_sb'
				@setback[1] = val
			when 'off_timer'
				@off_timer = val
			when 'off_duration'
				@off_duration = val
			end
		end
	end

	def stop_count(time)
		return if(@start_time == nil)
		@cool_op_time += (time-@start_time) if(@mode == 'cool')
		@heat_op_time += (time-@start_time) if(@mode == 'heat')
		@start_time = nil
	end
	def restart_count(time)
		if(@stat == 'on')
			stop_count(time)
			start_count(time)
		end
	end
	def th_start_count(time)
		@th_start_time = time
	end
	def th_stop_count(time)
		@th_on_time += (time-@th_start_time) if(@th_start_time != nil)
		@th_start_time = nil
	end
	def store_sample_value(time,db)
		db.add_analog(id+"/rt",time,@temp) if(@temp_avail == true)
		db.add_analog(id+"/sp",time,@csp) if(@csp != nil and @mode == 'cool')
		db.add_analog(id+"/sp",time,@hsp) if(@hsp != nil and @mode == 'heat')
		db.add_analog(id+"/wsp",time,@wcsp) if(@wcsp != nil and @mode == 'cool')
		db.add_analog(id+"/wsp",time,@whsp) if(@whsp != nil and @mode == 'heat')
		db.add_analog(id+"/ssp",time,@wstor_sp) if(@wstor_sp != nil)
	end
	def store_running_data(time,db)
		restart_count(time)
		if(@th_stat != nil and @th_stat == 'on')
			th_stop_count(time)
			th_start_count(time)
		end
		# add data to database
		db.add_optime(id,time,@cool_op_time+@heat_op_time,@cool_op_time,@heat_op_time,0,@th_on_time)
		db.add_ontimes(id,time,@on_times)
		# clear accumulated value
		@cool_op_time = 0
		@heat_op_time = 0
		@th_on_time = 0
		@on_times = 0
	end

	# private method
	def update_sp(sp, mode)
		key = nil
		mode = @mode if(mode == nil)
		if(mode == 'cool')
			key = 'csp' if(@ready and @csp != sp)
			@csp = sp
		elsif(mode == 'heat')
			key = 'hsp' if(@ready and @hsp != sp)
			@hsp = sp
		end
		key
	end

	def check_limitation
		command = {}
		# check set point
		csp = nil
		if(@csp != nil)
			csp = @csp_limit[0] if(@csp_limit_valid == true and @csp < @csp_limit[0])
			cps = @csp_range[0] if(@csp < @csp_range[0])
			csp = @csp_limit[1] if(@csp_limit_valid == true and @csp > @csp_limit[1])
			cps = @csp_range[1] if(@csp > @csp_range[1])
			command['csp'] = csp if(csp != nil)
		end
		hsp = nil
		if(@hsp != nil)
			hsp = @hsp_limit[0] if(@hsp_limit_valid == true and @hsp < @hsp_limit[0])
			hsp = @hsp_range[0] if(@hsp < @hsp_range[0])
			hsp = @hsp_limit[1] if(@hsp_limit_valid == true and @hsp > @hsp_limit[1])
			hsp = @hsp_range[1] if(@hsp > @hsp_range[1])
			command['hsp'] = hsp if(hsp != nil)
		end
		wcsp = nil
		if(@wcsp != nil)
			wcsp = @wcsp_range[0] if(@wsp_cap == true and @wcsp < @wcsp_range[0])
			wcsp = @wcsp_range[1] if(@wsp_cap == true and @wcsp > @wcsp_range[1])
			command['wcsp'] = wcsp
		end
		whsp = nil
		if(@whsp != nil)
			whsp = @whsp_range[0] if(@wsp_cap == true and @whsp < @whsp_range[0])
			whsp = @whsp_range[1] if(@wsp_cap == true and @whsp > @whsp_range[1])
			command['whsp'] = whsp
		end

		operate(command)
	end
end