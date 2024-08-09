# coding: utf-8

require_relative 'ManagementPoint'

class Chiller < ManagementPoint
	def initialize(pid, dev_id)
		super(pid, dev_id)
		# attribute of point
		@mode_cap = 'C'
		@manual_op_cap = true
		@rc_proh_cap = true
		@out_cap = true
		@wsp_cap = false
		@wsp_step = 1
		@dual_sp_cap = false
		@wcsp_range = [16,32]
		@whsp_range = [16,32]
		@low_noize_cap = false

		# point status
		@maintenance = nil
		@stat = nil
		@th_stat = nil
		@forced_off = nil
		@defrost = nil
		@low_noize_stat = nil

		@sp_mode = 'single'
		@wcsp = nil
		@whsp = nil

		@mode = nil

		@iw_avail = false
		@iw_temp = nil
		@ow_avail = false
		@ow_temp = nil

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
		'Chiller'
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
			when 'wcsp'
				check_wcsp(val,command['mode'],com,stat)
			when 'whsp'
				check_whsp(val,command['mode'],com,stat)
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
	def check_wcsp(val,mode,com,stat)
		return if(@wsp_cap == false)
		if(@dual_sp_cap == true)
			if(mode == 'cool' or mode == nil)
				com['wsp'] = val #if(val != @wcsp)
			elsif(mode == 'heat' or mode == nil)
				stat['wcsp'] = val #if(val != @wcsp)
			end
		else
			stat['wcsp'] = val #if(val != @wcsp)
		end
	end
	def check_whsp(val,mode,com,stat)
		return if(@wsp_cap == false)
		if(@dual_sp_cap == false)
			if(mode == 'heat' or mode == nil)
				com['wsp'] = val #if(val != @whsp)
			elsif(mode == 'cool' or mode == nil)
				stat['whsp'] = val #if(val != @whsp)
			end
		else
			stat['whsp'] = val #if(val != @whsp)
		end
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
	def check_low_noize_stat(val,com,stat)
		return if(@low_noize_cap == false)
		stat['low_noize_cap'] = val #if(val != @low_noize_cap)
	end

	def attribute
		{'ppd'=>@ppd_target,'mode_cap'=>@mode_cap,'wsp_cap'=>@wsp_cap,'wsp_step'=>@wsp_step,'dual_sp_cap'=>@dual_sp_cap,'wcsp_min'=>@wcsp_range[0],'wcsp_max'=>@wcsp_range[1],'whsp_min'=>@whsp_range[0],'whsp_max'=>@whsp_range[1],'low_noize_cap'=>@low_noize_cap,'manual_op_cap'=>@manual_op_cap,'rc_proh_cap'=>@rc_proh_cap,'out_cap'=>@out_cap}
	end

	def current_status
		{'maintenance'=>@maintenance,'com_stat'=>@com_stat,'stat'=>@stat,'th_stat'=>@th_stat,'forced_off'=>@forced_off,'low_noize_stat'=>@low_noize_stat,'sp_mode'=>@sp_mode,'wcsp'=>@wcsp,'whsp'=>@whsp,'mode'=>@mode,'defrost'=>@defrost,'rc_proh_stat'=>@rc_proh[0],'rc_proh_sp'=>@rc_proh[1],'rc_proh_mode'=>@rc_proh[2],'off_timer'=>@off_timer,'off_duration'=>@off_duration,'error'=>@error,'alarm'=>@alarm,'err_code'=>@err_code,'iw_avail'=>@iw_avail,'iw_temp'=>@iw_temp,'ow_avail'=>@ow_avail,'ow_temp'=>@ow_temp}
	end

	def get_snapshot
		{'maintenance'=>@maintenance,'sp_mode'=>@sp_mode,'wcsp'=>@wcsp,'whsp'=>@whsp,'off_timer'=>@off_timer,'off_duration'=>@off_duration,'cool_op_time'=>@cool_op_time,'heat_op_time'=>@heat_op_time,'th_on_time'=>@th_on_time}
	end

	# device layer method
	# point information update from device info
	# attr is hash
	def set_attr(attr)
		attr.each do |key, val|
			case key
			when 'ppd'
				@ppd_target = val
			when 'mode_cap'
				@mode_cap = val
			when 'manual_op_cap'
				@manual_op_cap = val
			when 'rc_proh_cap'
				@rc_proh_cap = val
			when 'out_cap'
				@out_cap = val
			when 'wsp_cap'
				@wsp_cap = val
			when 'wsp_step'
				@wsp_step = val
			when 'dual_sp_cap'
				@dual_sp_cap = val
			when 'wcsp_min'
				@wcsp_range[0] = val
			when 'wcsp_max'
				@wcsp_range[1] = val
			when 'whsp_min'
				@whsp_range[0] = val
			when 'whsp_max'
				@whsp_range[1] = val
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
			when 'th_stat'
				if(@ready and @th_stat != val)
					cos['th_stat'] = val 
					th_start_count(time) if(val == 'on')
					th_stop_count(time) if(val == 'off')
				end
				@th_stat = val
			when 'forced_off'
				cos['forced_off'] = val if(@ready and @forced_off != val)
				@forced_off = val
			when 'defrost'
				cos['defrost'] = val if(@ready and @defrost != val)
				@defrost = val
			when 'sp_mode'
				(cos[key] = val; stat_update = true) if(@ready and @sp_mode != val)
				@sp_mode = val
			when 'mode'
				if(@ready and @mode != val)
					cos['mode'] = val 
					restart_count(time)
				end
				@mode = val
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
			when 'low_noize_stat'
				cos['low_noize_stat'] = val if(@ready and @low_noze_stat != val)
				@low_noize_stat = val
			when 'wsp'
				key = update_wsp(val,status['mode'])
				(cos[key] = val; stat_update = true) if key != nil
			when 'wcsp'
				(cos['wcsp'] = val; stat_update = true) if(@ready and @wcsp != val)
				@wcsp = val
			when 'whsp'
				(cos['whsp'] = val; stat_update = true) if(@ready and @whsp != val)
				@whsp = val
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
			when 'off_timer'
				@off_timer = val
			when 'off_duration'
				@off_duration = val
			when 'wcsp'
				@wcsp = val
			when 'whsp'
				@whsp = val
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
		db.add_analog(id+"/iwt",time,@iw_temp) if(@iw_avail == true)
		db.add_analog(id+"/owt",time,@ow_temp) if(@ow_avail == true)
		db.add_analog(id+"/wsp",time,@wcsp) if(@wcsp != nil and @mode == 'cool')
		db.add_analog(id+"/wsp",time,@whsp) if(@whsp != nil and @mode == 'heat')
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
		store_sample_value(time,db)
		# clear accumulated value
		@cool_op_time = 0
		@heat_op_time = 0
		@th_on_time = 0
		@on_times = 0
	end

	# private method
	def update_wsp(wsp, mode)
		key = nil
		mode = @mode if(mode == nil)
		if(mode == 'cool')
			key = 'wcsp' if(@ready and @wcsp != wsp)
			@wcsp = wsp
		elsif(mode == 'heat')
			key = 'whsp' if(@ready and @whsp != wsp)
			@whsp = wsp
		end
		key
	end

	def check_limitation
		command = {}
		# check set point
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