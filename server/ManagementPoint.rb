#coding: utf-8

# pid should be integer
class ManagementPoint
	def initialize(pid, dev_id)
		@pid = pid
		@dev_id = dev_id
		@svm_dev = nil
		@name = id
		@ppd_target = false
		@icon = nil
		@sub_type = nil
		@usage = nil

		@clock = nil

		@ready = false
		@com_stat = false
		@maintenance = false
		@error = false
		@alarm = false
		@err_code = ''

		@parent = nil	#point id
		@children = nil # {pointid=>nil,...} this is used to check cos
		@hide = false
		@notuse = false
		@notification = false	# if this is true then notify will generate from point status

		@battery_enable = false
		@battery = 0

		@save = true	# if this is flase then this point is not save in point list
	end

	attr_reader :pid, :dev_id, :ready,:ppd_target,:hide,:battery_enable,:notuse,:children,:parent, :save
	attr_accessor :name, :icon, :sub_type, :usage, :svm_dev

	def class_type
		self.class.to_s
	end

	def point_type
		'point'
	end

	def init(data_man)
	end

	def ManagementPoint.get_id(pid,dev_id)
		"#{dev_id}-#{sprintf("%05d",pid)}"
	end

	# these method does not need to overwrite	
	def id
		ManagementPoint.get_id(@pid,@dev_id)
	end
	
	def set_parent(point)
		@parent = point
	end

	def point_info
		{'type'=>point_type,'subtype'=>sub_type, 'usage'=>usage, 'id'=>id,'pid'=>@pid,'dev_id'=>@dev_id,'name'=>@name,'icon'=>@icon,'attr'=>attribute}
	end

	def update_attr(point)
		return false if(self.class != point.class)

		ret = false

		if(point.ppd_target == true && @ppd_target == false)
			@ppd_target = true
			ret = true
		end
		if(point.battery_enable != @battery_enable)
			@battery_enable = point.battery_enable
			ret = true
		end

		if(@usage != point.usage)
			@usage = point.usage
			ret = true
		end

		if(@subtype != point.sub_type)
			@subtype = point.sub_type
			ret = true
		end

		return ret
	end

	# this method is for Pi to set latest value
	def set_db_value(db)
	end

	# return command hash to device and status update hash by itself
	def operate(command)
		com = {}
		stat = {}
		return com,stat if(@ready == false)
		command_dispatch(command,com,stat)

		# if command include maintenance true then send only maintenance command
		# other command will be ignored
		return {'maintenance'=>true},{} if(com['maintenance'] == true)
		return {},{'maintenance'=>true} if(stat['maintenance'] == true)
		return com,stat
	end

	def command_dispatch(command,com,stat)
		command.each do |type, val|
			case type
			when 'ircommand'
				check_ircommand(val,com,stat)
			when 'maintenance'
				check_maintenance(val,com,stat)
			when 'stat'
				check_stat(val,com,stat)
			when 'lock'
				check_lock(val,com,stat)
			when 'sp_mode'
				check_sp_mode(val,com,stat)
			when 'sp'
				check_sp(val.to_f,com,stat)
			when 'csp'
				check_csp(val.to_f,command['mode'],com,stat)
			when 'hsp'
				check_hsp(val.to_f,command['mode'],com,stat)
			when 'csp_limit_valid'
				check_csp_limit_valid(val,com,stat,command)
			when 'csp_l'
				check_csp_l(val.to_f,com,stat,command)
			when 'csp_h'
				check_csp_h(val.to_f,com,stat,command)
			when 'hsp_limit_valid'
				check_hsp_limit_valid(val,com,stat,command)
			when 'hsp_l'
				check_hsp_l(val.to_f,com,stat,command)
			when 'hsp_h'
				check_hsp_h(val.to_f,com,stat,command)
			when 'csp_sb'
				check_csp_sb(val,com,stat)
			when 'hsp_sb'
				check_hsp_sb(val,com,stat)
			when 'mode'
				check_mode(val,command['sp_mode'],com,stat)
			when 'fanstep'
				check_fanstep(val,com,stat)
			when 'flap'
				check_flap(val,com,stat)
			when 'flap2'
				check_flap2(val,com,stat)
			when 'filter_clr'
				check_filter_clr(val,com,stat)
			when 'rc_proh_stat'
				check_rc_proh_stat(val,com,stat)
			when 'rc_proh_sp'
				check_rc_proh_sp(val,com,stat)
			when 'rc_proh_mode'
				check_rc_proh_mode(val,com,stat)
			when 'off_timer'
				check_off_timer(val,com,stat)
			when 'off_duration'
				check_off_duration(val.to_i,com,stat)
			when 'vmode'
				check_vmode(val,com,stat)
			when 'vamount'
				check_vamount(val,com,stat)
			when 'fresh_up'
				check_fresh_up(val,com,stat)
			when 'repeat'
				check_repeat(val,com,stat)
			when 'rep_duration'
				check_rep_duration(val.to_i,com,stat)
			when 'av'
				check_av(val.to_f,com,stat)
			when 'r'
				check_r(val.to_f,com,stat)
			when 'g'
				check_g(val.to_f,com,stat)
			when 'b'
				check_b(val.to_f,com,stat)
			when 'w'
				check_w(val.to_f,com,stat)
			when 'ulimit_monitor'
				check_ulimit_monitor(val,com,stat)
			when 'ulimit'
				check_ulimit(val.to_f,com,stat)
			when 'llimit_monitor'
				check_llimit_monitor(val,com,stat)
			when 'llimit'
				check_llimit(val.to_f,com,stat)
			when 'wcsp'
				check_wcsp(val.to_f,command['mode'],com,stat)
			when 'whsp'
				check_whsp(val.to_f,command['mode'],com,stat)
			when 'wstor_sp'
				check_wstor_sp(val.to_f,com,stat)
			when 'low_noize_stat'
				check_low_noize_stat(val,com,stat)
			when 'ms_val'
				check_ms_val(val.to_i,com,stat)
			when 'on_proh'
				check_on_prohibition(val,com,stat)
			when 'updown'
				check_updown(val,com,stat)
			when 'notification'
				check_notification(val,com,stat)
			when 'off_delay'
				check_off_delay(val.to_i,com,stat)
			when 'fvmode'
				check_fvmode(val,com,stat)
			when 'bvmode'
				check_bvmode(val,com,stat)
			when 'dehum_mode'
				check_dehum_mode(val,com,stat)
			when 'powerful'
				check_powerful(val,com)
			when 'hum_sp'
				check_hum_sp(val,com)
			end
		end
	end

	def get_attribute
		return {} if(@ready == false)
		attribute
	end

	def get_status(stat=nil)
		return {} if(@ready == false)

		current = current_status

		if(stat != nil)
			return stat.merge(current)
		end
		return current
	end

	def set_attribute(attr)
		return if(attr == nil)

		set_attr(attr)
	end

	def set_dev_attr(attr)
	end
	
	def update_status(status,clock,db=nil,history=nil)
		cos = {}
		return {},{} if(status == nil)

		@clock = clock if(@clock == nil)

		# if parent is exist then call parent's update_status
#		return update_status(status,clock,db,history) if(@parent != nil)

		time = @clock.get_time
		if(status['maintenance'] == true)
			if(@ready and @maintenance == false)
				@maintenance = true
				stop_count(time)	# stop count up under maintenance
				th_stop_count(time)
				cos = {'maintenance'=>true}
				history.cos(id,cos) if(history != nil)
				return cos,{}
			else
				return {},{}
			end
		elsif(@maintenance == true and status['maintenance'] != false)
			# during maintenance nothing update
			return {},{}
		end
		if(status['com_stat'] == false)
			if(@ready and @com_stat == true)
				@com_stat = false
				stop_count(time)	# stop count up under comm error
				cos = {'com_stat'=>false}
				history.cos(id,cos) if(history != nil)
				return cos,{}
			else
				return {},{}
			end
		elsif(@com_stat == false and status['com_stat'] != true)
		 	if(status['maintenance'] == false)
				cos = {'maintenance'=>false}
				history.cos(id,cos) if(history != nil)
				return cos,{}
			else	
				# during com error nothing update
				return {},{}
			end
		end

		com = update_stat(status,cos,time,db)
		if(@ready == false)
			@ready = true
			start_count_if_on(time)
			th_start_count_if_on(time)
			return get_status,com
		else
			history.cos(id,cos) if(history != nil)
			if(cos['maintenance'] == false or cos['com_stat'] == true)
				return get_status,com
			else
				return cos,com
			end
		end
	end
	def update_stat(status,cos,time,db=nil)
		status_update = false
		status.each do |key, val|
			next if(val == nil && key != 'csp_sb' && key != 'hsp_sb')
			case key
			when 'maintenance'
				status_update = true if update_maintenance(val,cos,time)
			when 'com_stat'
				update_com_stat(val,cos,time) 
			when 'stat'
				status_update = true if update_statv(val,cos,time)
			when 'forced_off'
				update_forced_off(val,cos)
			when 'sp_mode'
				status_update = true if update_sp_mode(val,cos)
			when 'sp'
				status_update = true if update_sp(val,cos,status)
			when 'csp'
				status_update = true if update_csp(val,cos)
			when 'hsp'
				status_update = true if update_hsp(val,cos)
			when 'csp_limit_valid'
				status_update = true if update_csp_limit_valid(val,cos)
			when 'csp_l'
				status_update = true if update_csp_l(val,cos)
			when 'csp_h'
				status_update = true if update_csp_h(val,cos)
			when 'hsp_limit_valid'
				status_update = true if update_hsp_limit_valid(val,cos)
			when 'hsp_l'
				status_update = true if udpate_hsp_l(val,cos)
			when 'hsp_h'
				status_update = true if update_hsp_h(val,cos)
			when 'csp_sb'
				status_update = true if update_csp_sb(val,cos)
			when 'hsp_sb'
				status_update = true if update_hsp_sb(val,cos)
			when 'sb_stat'
#				puts "sb stat"
				update_sb_stat(val,cos)
			when 'ch_master'
				update_ch_master(val,cos)
			when 'mode'
				update_mode(val,cos,time)
			when 'actual_mode'
				update_actual_mode(val,cos,time)
			when 'fanstep'
				update_fanstep(val,cos)
			when 'flap'
				update_flap(val,cos)
			when 'flap2'
				update_flap2(val,cos)
			when 'filter'
				update_filter(val,cos)
			when 'th_stat'
				update_th_stat(val,cos,time)
			when 'defrost'
				update_defrost(val,cos)
			when 'thermo_err'
				update_thermo_err(val,cos)
			when 'temp'
				update_temp(val,cos)
			when 'temp_avail'
				update_temp_avail(val,cos)
			when 'rc_proh_stat'
				update_rc_proh_stat(val,cos)
			when 'rc_proh_sp'
				update_rc_proh_sp(val,cos)
			when 'rc_proh_mode'
				update_rc_proh_mode(val,cos)
			when 'off_timer'
				status_update = true if update_off_timer(val,cos)
			when 'off_duration'
				status_update = true if update_off_duration(val,cos)
			when 'error'
				update_error(val,cos)
			when 'alarm'
				update_alarm(val,cos)
			when 'err_code'
				update_err_code(val,cos)
			when 'vmode'
				update_vmode(val,cos)
			when 'vamount'
				update_vamount(val,cos)
			when 'fresh_up'
				update_fresh_up(val,cos)
			when 'repeat'
				status_update = true if update_repeat(val,cos)
			when 'rep_duration'
				status_update = true if update_rep_duration(val,cos)
			when 'av'
				update_av(val,cos,time)
			when 'ulimit_monitor'
				status_update = true if update_ulimit_monitor(val,cos)
			when 'ulimit'
				status_update = true if update_ulimit(val,cos)
			when 'llimit_monitor'
				status_update = true if update_llimit_monitor(val,cos)
			when 'llimit'
				status_update = true if update_llimit(val,cos)
			when 'meter'
				update_meter(val,cos)
			when 'power'
				update_power(val,cos)
			when 'demand'
				update_demand(val,cos)
			when 'wreh_stat'
				update_wreh_stat(val,cos)
			when 'wstor_stat'
				update_wstor_stat(val,cos)
			when 'wcsp'
				update_wcsp(val,cos)
			when 'whsp'
				update_whsp(val,cos)
			when 'wstor_sp'
				update_wstor_sp(val,cos)
			when 'low_noize_stat'
				update_low_noize_stat(val,cos)
			when 'iw_avail'
				update_iw_avail(val,cos)
			when 'iw_temp'
				update_iw_temp(val,cos)
			when 'ow_avail'
				update_ow_avail(val,cos)
			when 'ow_temp'
				update_ow_temp(val,cos)
			when 'ms_val'
				update_ms_val(val,cos)
			when 'on_proh'
				update_on_prohibition(val,cos)
			when 'battery'
				update_battery(val,cos)
			when 'level'
				update_level(val,cos,time)
			when 'r'
				update_r(val,cos)
			when 'g'
				update_g(val,cos)
			when 'b'
				update_b(val,cos)
			when 'w'
				update_w(val,cos)
			when 'updown'
				update_updown(val,cos)
			when 'notification'
				update_notification(val,cos)
			when 'off_delay'
				update_off_delay(val,cos)
			when 'fvmode'
				update_fvmode(val,cos)
			when 'bvmode'
				update_bvmode(val,cos)
			when 'dehum_mode'
				update_dehum_mode(val,cos)
			when 'powerful'
				update_powerful(val,cos)
			when 'hum_sp'
				update_hum_sp(val,cos)
			end
		end
		db.update_status(id,get_snapshot) if(db != nil and status_update == true)
		command = operate_by_cos(cos)
		set_off_timer(cos,time)
		return command
	end

	########################################################
	# these methods should overwrite in sub class
	# get_attribute relate method
	def attribute
		{'ppd'=>@ppd_target,'parent'=>@parent,'children'=>@children,'hide'=>@hide,'notuse'=>@notuse,'battery'=>@battery_enable,'notification'=>@notification}
	end

	# get_status relate method
	def current_status
		stat = {'maintenance'=>@maintenance,'com_stat'=>@com_stat,'error'=>@error,'alarm'=>@alarm,'err_code'=>@err_code,'notify'=>@notify}
		stat.update({'battery'=>@battery}) if(@battery_enable == true)
		return stat
	end

	# get snap shop of current status related storing data
	def get_snapshot
		{'maintenance'=>@maintenance}
	end

	# set_attribute relate method
	def set_attr(attr)
		attr.each do |key,val|
			case key
			when 'ppd'
				@ppd_target = val
			when 'parent'
				@parent = val
			when 'children'
				@children = val
				if(@children != nil)	# reset cos information from children
					@children.each do |id,data|
						@children[id] = nil
					end
				end
			when 'hide'
				@hide = val
			when 'notuse'
				@notuse = val
			when 'battery'
				@battery_enable = val
			when 'notification'
				@notification = val
			end
		end
	end

	# operation relate method
	def check_ircommand(val,com,stat)
	end
	def check_maintenance(val,com,stat)
		stat['maintenance'] = val if(val != @maintenance)
	end
	def check_stat(val,com,stat)
	end
	def check_lock(val,com,stat)
	end
	def check_sp_mode(val,com,stat)
	end
	def check_sp(val,com,stat)
	end
	def check_csp(val,mode,com,stat)
	end
	def check_hsp(val,mode,com,stat)
	end
	def check_csp_limit_valid(val,com,stat,command)
	end
	def check_csp_l(val,com,stat,command)
	end
	def check_csp_h(val,com,stat,command)
	end
	def check_hsp_limit_valid(val,com,stat,command)
	end
	def check_hsp_l(val,com,stat,command)
	end
	def check_hsp_h(val,com,stat,command)
	end
	def check_csp_sb(val,com,stat)
	end
	def check_hsp_sb(val,com,stat)
	end
	def check_mode(val,sp_mode,com,stat)
	end
	def check_fanstep(val,com,stat)
	end
	def check_flap(val,com,stat)
	end
	def check_flap2(val,com,stat)
	end
	def check_filter_clr(val,com,stat)
	end
	def check_rc_proh_stat(val,com,stat)
	end
	def check_rc_proh_sp(val,com,stat)
	end
	def check_rc_proh_mode(val,com,stat)
	end
	def check_off_timer(val,com,stat)
	end
	def check_off_duration(val,com,stat)
	end
	def check_vmode(val,com,stat)
	end
	def check_vamount(val,com,stat)
	end
	def check_fresh_up(val,com,stat)
	end
	def check_repeat(val,com,stat)
	end
	def check_rep_duration(val,com,stat)
	end
	def check_av(val,com,stat)
	end
	def check_r(val,com,stat)
	end
	def check_g(val,com,stat)
	end
	def check_b(val,com,stat)
	end
	def check_w(val,com,stat)
	end
	def check_ulimit_monitor(val,com,stat)
	end
	def check_ulimit(val,com,stat)
	end
	def check_llimit_monitor(val,com,stat)
	end
	def check_llimit(val,com,stat)
	end
	def check_wcsp(val,mode,com,stat)
	end
	def check_whsp(val,mode,com,stat)
	end
	def check_wstor_sp(val,com,stat)
	end
	def check_low_noize_stat(val,com,stat)
	end
	def check_ms_val(val,com,stat)
	end
	def check_on_prohibition(val,com,stat)
	end
	def check_updown(val,com,stat)
	end
	def check_notification(val,com,stat)
		stat['notification'] = val
	end
	def check_off_delay(val,com,stat)
	end
	def check_fvmode(val,com,stat)
	end
	def check_bvmode(val,com,stat)
	end
	def check_dehum_mode(val,com,stat)
	end
	def check_powerful(val,com,stat)
	end
	def check_hum_sp(val,com,stat)
	end

	# update_status relate method
	def update_maintenance(val,cos,time)
		if(@ready and @maintenance)
			cos['maintenance'] = false 
			start_count_if_on(time)
			@maintenance = false
			return true
		end
		return false
	end
	def update_com_stat(val,cos,time)
		if(@ready and @com_stat == false)
			cos['com_stat'] = true 
			start_count_if_on(time)
		end
		@com_stat = true
	end
	def update_statv(val,cos,time)
	end
	def update_forced_off(val,cos)
	end
	def update_sp_mode(val,cos)
		return false
	end
	def update_sp(val,cos,stat)
		return false
	end
	def update_csp(val,cos)
		return false
	end
	def update_hsp(val,cos)
		return false
	end
	def update_csp_limit_valid(val,cos)
		return false
	end
	def update_csp_l(val,cos)
		return false
	end
	def update_csp_h(val,cos)
		return false
	end
	def update_hsp_limit_valid(val,cos)
		return false
	end
	def udpate_hsp_l(val,cos)
		return false
	end
	def update_hsp_h(val,cos)
		return false
	end
	def update_csp_sb(val,cos)
		return false
	end
	def update_hsp_sb(val,cos)
		return false
	end
	def update_sb_stat(val,cos)
	end
	def update_ch_master(val,cos)
	end
	def update_mode(cal,cos,time)
	end
	def update_actual_mode(val,cos,time)
	end
	def update_fanstep(val,cos)
	end
	def update_flap(val,cos)
	end
	def update_flap2(val,cos)
	end
	def update_filter(val,cos)
	end
	def update_th_stat(val,cos,time)
	end
	def update_defrost(val,cos)
	end
	def update_thermo_err(val,cos)
	end
	def update_temp(val,cos)
	end
	def update_temp_avail(val,cos)
	end
	def update_rc_proh_stat(val,cos)
	end
	def update_rc_proh_sp(val,cos)
	end
	def update_rc_proh_mode(val,cos)
	end
	def update_off_timer(val,cos)
		return false
	end
	def update_off_duration(val,cos)
		return false
	end
	def update_error(val,cos)
		cos['error'] = val if(@ready and @error != val)
		@error = val
	end
	def update_alarm(val,cos)
		cos['alarm'] = val if(@ready and @alarm != val)
		@alarm = val
	end
	def update_err_code(val,cos)
		cos['err_code'] = val if(@ready and @err_code != val)
		@err_code = val
	end
	def update_vmode(val,cos)
	end
	def update_vamount(val,cos)
	end
	def update_fresh_up(val,cos)
	end
	def update_repeat(val,cos)
		return false
	end
	def update_rep_duration(val,cos)
		return false
	end
	def update_av(val,cos,time)
	end
	def update_ulimit_monitor(val,cos)
		return false
	end
	def update_ulimit(val,cos)
		return false
	end
	def update_llimit_monitor(val,cos)
		return false
	end
	def update_llimit(val,cos)
		return false
	end
	def update_meter(val,cos)
	end
	def update_power(val,cos)
	end
	def update_demand(val,cos)
	end
	def update_wreh_stat(val,cos)
	end
	def update_wstor_stat(val,cos)
	end
	def update_wcsp(val,cos)
	end
	def update_whsp(val,cos)
	end
	def update_wstor_sp(val,cos)
	end
	def update_low_noize_stat(val,cos)
	end
	def update_iw_avail(val,cos)
	end
	def update_iw_temp(val,cos)
	end
	def update_ow_avail(val,cos)
	end
	def update_ow_temp(val,cos)
	end
	def update_ms_val(val,cos)
	end
	def update_on_prohibition(val,cos)
	end
	def update_battery(val,cos)
		if(@ready && @battery != val)
			cos['battery'] = val 
			cos['notify'] = 'bat_low' if(val < 20)
		end
		@battery = val
	end
	def update_level(val,cos,time)
	end
	def update_r(val,cos)
	end
	def update_g(val,cos)
	end
	def update_b(val,cos)
	end
	def update_w(val,cos)
	end
	def update_updown(val,cos)
	end
	def update_notification(val,cos)
		cos['notification'] = val if(@ready and @notification != val)
		@notification = val
	end
	def update_off_delay(val,cos)
	end
	def update_fvmode(val,cos)
	end
	def update_dehum_mode(val,cos)
	end
	def update_bvmode(val,cos)
	end
	def update_powerful(val,cos)
	end
	def update_hum_sp(val,cos)
	end
	
	def set_off_timer(cos,time)
	end
	def operate_by_cos(cos)
		return {}
	end

	# count up operation time if the point is operating
	def start_count_if_on(time)
	end
	def start_count(time)
	end
	def stop_count(time)
	end
	def restart_count(time)
	end
	def th_start_count_if_on(time)
	end
	def th_start_count(time)
	end
	def th_stop_count(time)
	end

	# these methods are called from DataManager 
	def store_sample_value(time,db)
	end
	def store_running_data(time,db)
	end

	# status initialization from database
	def set_init_status(stat)
		stat.each do |key, val|
			case key
			when 'maintenance'
				@maintenance = val
			end
		end
	end
end