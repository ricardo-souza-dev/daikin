# coding: utf-8

require_relative 'Dio'

class Fcu < Dio
	def initialize(pid, dev_id)
		super
		# attribute of point
		@icon = 'FXFQA.png'
		@sp_cap = false
		@sp_step = 1
		@csp_range = [16,32]
		@hsp_range = [16,32]
		@mode_cap = 'F'
		@fansteps = 0
		@fanstep_cap = false
		@fanstep_auto_cap = false
		@flap_cap = false
		@flap_steps = 5
		@rc_master = true
		@rc_proh_cap = true
		@ch_master_f = nil

		# point status
		@th_stat = nil
		@forced_off = nil
		@defrost = nil

		@sp_mode = 'single'
		@csp = nil
		@csp_com = nil
		@hsp = nil
		@hsp_com = nil
		@csp_limit_valid = false
		@csp_limit = [nil,nil]
		@hsp_limit_valid = false
		@hsp_limit = [nil,nil]
		@setback = [nil,nil]
		@sb_stat = 'off'
		@sb_timer = nil
		@sb_stop_duration = 10*60 # sec
		@sb_stop_cond = 2	# if 2deg higher or lower from setback condition(not sp) then setback will stop imidiately

		@ch_master = nil
		@mode = nil
		@actual_mode = nil

		@fanstep = nil
		@self_fanstep_auto = false
		@auto_start = false
		@fstep_auto = nil
		@fstep_com = nil
		@com_timer = nil
		@fstep_block = false
		@flap = nil

		@temp = nil
		@temp_avail = false

		@filter_sign = nil
		@thermo_err = nil

		@rc_proh = [nil,nil,nil]

		# temp value storage
		@temp_data = false

		# total value
		@th_start_time = nil
		@cool_op_time = 0
		@heat_op_time = 0
		@fan_op_time = 0
		@th_on_time = 0
	end

	attr_reader :sb_stat
	
	def point_type
		'Fcu'
	end
	
	def attribute
		super.merge({'sp_cap'=>@sp_cap,'sp_step'=>@sp_step,'csp_min'=>@csp_range[0],'csp_max'=>@csp_range[1],'hsp_min'=>@hsp_range[0],'hsp_max'=>@hsp_range[1],'mode_cap'=>@mode_cap,'fanstep_cap'=>@fanstep_cap,'fanstep_auto_cap'=>@fanstep_auto_cap,'fansteps'=>@fansteps,'flap_cap'=>@flap_cap,'flap_steps'=>@flap_steps,'rc_master'=>@rc_master,'rc_proh_cap'=>@rc_proh_cap,'temp_db'=>@temp_data})
	end

	def current_status
		super.merge({'forced_off'=>@forced_off,'sp_mode'=>@sp_mode,'csp'=>@csp,'hsp'=>@hsp,'csp_limit_valid'=>@csp_limit_valid,'csp_l'=>@csp_limit[0],'csp_h'=>@csp_limit[1],'hsp_limit_valid'=>@hsp_limit_valid,'hsp_l'=>@hsp_limit[0],'hsp_h'=>@hsp_limit[1],'csp_sb'=>@setback[0],'hsp_sb'=>@setback[1],'sb_stat'=>@sb_stat,'ch_master'=>@ch_master,'mode'=>@mode,'actual_mode'=>@actual_mode,'fanstep'=>@fanstep,'flap'=>@flap,'filter'=>@filter_sign,'th_stat'=>@th_stat,'defrost'=>@defrost,'thermo_err'=>@thermo_err,'temp'=>@temp,'temp_avail'=>@temp_avail,'rc_proh_stat'=>@rc_proh[0],'rc_proh_sp'=>@rc_proh[1],'rc_proh_mode'=>@rc_proh[2]})
	end

	def get_snapshot
		super.merge({'sp_mode'=>@sp_mode,'csp'=>@csp,'hsp'=>@hsp,'csp_limit_valid'=>@csp_limit_valid,'csp_l'=>@csp_limit[0],'csp_h'=>@csp_limit[1],'hsp_limit_valid'=>@hsp_limit_valid,'hsp_l'=>@hsp_limit[0],'hsp_h'=>@hsp_limit[1],'csp_sb'=>@setback[0],'hsp_sb'=>@setback[1]})
	end

		####### auto mode check
	def auto_cap?
		return @mode_cap.include?("A")
	end

# device layer method
	# point information update from device info
	# attr is hash
	def set_attr(attr)
		super
		puts "set_attr #{attr}"
		attr.each do |key, val|
			case key
			when 'sp_cap'
				@sp_cap = val
			when 'sp_step'
				@sp_step = val
			when 'csp_min'
				@csp_range[0] = val
				@csp_limit[0] = val if(@csp_limit[0] == nil)
			when 'csp_max'
				@csp_range[1] = val
				@csp_limit[1] = val if(@csp_limit[1] == nil)
			when 'hsp_min'
				@hsp_range[0] = val
				@hsp_limit[0] = val if(@hsp_limit[0] == nil)
			when 'hsp_max'
				@hsp_range[1] = val
				@hsp_limit[1] = val if(@hsp_limit[1] == nil)
			when 'mode_cap'
				@mode_cap = val
			when 'fansteps'
				@fansteps = val
			when 'fanstep_cap'
				@fanstep_cap = val
			when 'fanstep_auto_cap'
				@fanstep_auto_cap = val
			when 'flap_cap'
				@flap_cap = val
			when 'flap_auto_cap'
				@flap_auto_cap = val
			when 'flap2_cap'
				@flap2_cap = val
			when 'flap2_auto_cap'
				@flap2_auto_cap = val
			when 'rc_master'
				@rc_master = val
			when 'rc_proh_cap'
				@rc_proh_cap = val
			when 'ch_master'
				@ch_master_f = val
			when 'powerful_cap'
				@powerful_cap = val
			when 'temp_db'
				@temp_data = val
			end
		end
	end

	# these method should be overwrite in sub class
	def check_stat(val,com,stat)
		com['stat'] = val #if(val != @stat)
		if(@sb_stat == 'on')
			end_setback_by_operation(com,stat)
		end
	end
	def check_sp_mode(val,com,stat)
		return if(@sp_cap == false)
		stat['sp_mode'] = val #if(val != @sp_mode)
	end
	def check_sp(val,com,stat)
		return if(@sp_cap == false)
		com['sp'] = val
		@csp_com = @hsp_com = val
	end
	def check_csp(val,mode,com,stat)
		return if(@sp_cap == false)
		get_dev_com_csp(val,mode,com,stat)
		@csp_com = val
	end
	def get_dev_com_csp(val,mode,com,stat)
		#puts "csp: mode:#{mode} actual_mode:#{@actual_mode}"
		if(mode == 'cool' or (mode == nil and @actual_mode == 'cool'))
			#if(val != @csp)
				com['sp'] = val
#				stat['sb_stat'] = 'off' if(@sb_stat == 'on' and @stat == 'on')
			#end 
		elsif(mode == 'heat' or (mode == nil and @actual_mode == 'heat'))
			stat['csp'] = val #if(val != @csp)
		end
	end
	def check_hsp(val,mode,com,stat)
		return if(@sp_cap == false)
		get_dev_com_hsp(val,mode,com,stat)
		@hsp_com = val
	end
	def get_dev_com_hsp(val,mode,com,stat)
		if(mode == 'heat' or (mode == nil and @actual_mode == 'heat'))
			#if(val != @hsp)
				com['sp'] = val 
#				stat['sb_stat'] = 'off' if(@sb_stat == 'on' and @stat == 'on')
			#end
		elsif(mode == 'cool' or (mode == nil and @actual_mode == 'cool'))
			stat['hsp'] = val #if(val != @hsp)
		end
	end
	def check_csp_limit_valid(val,com,stat,command)
		return if(@sp_cap == false)
		stat['csp_limit_valid'] = val #if(val != @csp_limit_valid)
	end
	def check_csp_l(val,com,stat,command)
		return if(@sp_cap == false)
		val = @csp_range[0] if(val < @csp_range[0])
		val = @csp_range[1] if(val > @csp_range[1])
		stat['csp_l'] = val #if(val != @csp_limit[0])
	end
	def check_csp_h(val,com,stat,command)
		return if(@sp_cap == false)
		val = @csp_range[0] if(val < @csp_range[0])
		val = @csp_range[1] if(val > @csp_range[1])
		stat['csp_h'] = val #if(val != @csp_limit[1])
	end
	def check_hsp_limit_valid(val,com,stat,command)
		return if(@sp_cap == false)
		stat['hsp_limit_valid'] = val #if(val != @hsp_limit_valid)
	end
	def check_hsp_l(val,com,stat,command)
		return if(@sp_cap == false)
		val = @hsp_range[0] if(val < @hsp_range[0])
		val = @hsp_range[1] if(val > @hsp_range[1])
		stat['hsp_l'] = val #if(val != @hsp_limit[0])
	end
	def check_hsp_h(val,com,stat,command)
		return if(@sp_cap == false)
		val = @hsp_range[0] if(val < @hsp_range[0])
		val = @hsp_range[1] if(val > @hsp_range[1])
		stat['hsp_h'] = val #if(val != @hsp_limit[1])
	end
	def check_csp_sb(val,com,stat)
		return if(@sp_cap == false)
		if(val == 'null' || val == nil)
			val = nil 
		else
			val = val.to_f
		end
		if(val != @setback[0])
			stat['csp_sb'] = val 
			com['sp'] = val-1 if(@sb_stat == 'on' and @actual_mode == 'cool' and val != nil)
		end
	end
	def check_hsp_sb(val,com,stat)
		return if(@sp_cap == false)
		if(val == 'null' || val == nil)
			val = nil 
		else
			val = val.to_f
		end
		if(val != @setback[1])
			stat['hsp_sb'] = val 
			com['sp'] = val+1 if(@sb_stat == 'on' and @actual_mode == 'heat' and val != nil)
		end
	end
	def check_mode(val,sp_mode,com,stat)
		return if(@mode_cap.index(val[0].upcase) == nil and val != 'temp')
			 
		#if(val != @mode)
			com['mode'] = val if((val != "cool" && val != "heat") || @ch_master == true)
			com['mode'] = 'temp' if((val == "cool" || val == "heat") && @ch_master == false)

			if(sp_mode == 'dual' or (sp_mode == nil and @sp_mode == 'dual'))
				if(val == 'cool' and com['sp'] == nil)
					com['sp'] = @csp_com if(@sb_stat == 'off')
					com['sp'] = @setback[0] if(@sb_stat == 'on')
				elsif(val == 'heat' and com['sp'] == nil) 	
					com['sp'] = @hsp_com if(@sb_stat == 'off')
					com['sp'] = @setback[1] if(@sb_stat == 'on')
				end
			end
		#end
	end
	def check_fanstep(val,com,stat)
		return if(@fanstep_cap == false)
		if(@fanstep_auto_cap == false && val == 'auto')
			puts "SEt FANSTEP AUTO"
			# set self auto start flag
			@self_fanstep_auto = true
			@auto_start = true
			# don't send auto command in this case
			stat['fanstep'] = val # auto
			@fstep_auto = @fanstep  # store current fanstep under self auto mode
			@fstep_com = nil
		else
			puts "FANSTEP #{val} #{@fanstep_auto_cap}"
			@auto_start = false
			@fstep_auto = nil
			@fstep_com = val #nil # test
			@self_fanstep_auto = false
			com['fanstep'] = val #if(val != @fanstep)
		end
	end
	def check_flap(val,com,stat)
		return if(@flap_cap == false)
		if(val == 'swing')
			com['flap'] = val #if(val != @flap)
		else
			com['flap'] = val.to_i #if(val.to_i != @flap)
		end
	end
	def check_filter_clr(val,com,stat)
		com['filter_clr'] = val #if(val ==true)
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

	# status update from device
	# status is hash
	# maintenance should be false and com_stat should be true in this method
	def update_forced_off(val,cos)
		cos['forced_off'] = val if(@ready and @forced_off != val)
		@forced_off = val
	end
	def update_sp_mode(val,cos)
		update = false
		(cos['sp_mode'] = val; update=true) if(@ready and @sp_mode != val)
		@sp_mode = val
		return update
	end
	def update_sp(val,cos,stat)
		update = false
		key = update_dual_sp(val,cos['actual_mode'],stat['actual_mode'])
		(cos[key] = val; update=true) if(key != nil)
		return update
	end
	def update_csp(val,cos)
		update = false
		(cos['csp'] = val; update=true) if(@ready and @csp != val)
		@csp = val
		@csp_com = val if(@csp_com == nil)
		return update
	end
	def update_hsp(val,cos)
		update = false
		(cos['hsp'] = val; update=true) if(@ready and @hsp != val)
		@hsp = val
		@hsp_com = val if(@hsp_com == nil)
		return update
	end
	def update_csp_limit_valid(val,cos)
		update = false
		#puts "update_csp_limit_valid #{val}"
		(cos['csp_limit_valid'] = val; update=true) if(@ready and @csp_limit_valid != val)
		@csp_limit_valid = val
		return update
	end
	def update_csp_l(val,cos)
		update = false
		val = @csp_range[0] if(val < @csp_range[0])
		val = @csp_range[1] if(val > @csp_range[1])
		(cos['csp_l'] = val; update=true) if(@ready and @csp_limit[0] != val)
		@csp_limit[0] = val
		return update
	end
	def update_csp_h(val,cos)
		update = false
		val = @csp_range[0] if(val < @csp_range[0])
		val = @csp_range[1] if(val > @csp_range[1])
		(cos['csp_h'] = val; update=true) if(@ready and @csp_limit[1] != val)
		@csp_limit[1] = val
		return update
	end
	def update_hsp_limit_valid(val,cos)
		update = false
		(cos['hsp_limit_valid'] = val; update=true) if(@ready and @hsp_limit_valid != val)
		@hsp_limit_valid = val
		return update
	end
	def udpate_hsp_l(val,cos)
		update = false
		val = @hsp_range[0] if(val < @hsp_range[0])
		val = @hsp_range[1] if(val > @hsp_range[1])
		(cos['hsp_l'] = val; update=true) if(@ready and @hsp_limit[0] != val)
		@hsp_limit[0] = val
		return update
	end
	def update_hsp_h(val,cos)
		update = false
		val = @hsp_range[0] if(val < @hsp_range[0])
		val = @hsp_range[1] if(val > @hsp_range[1])
		(cos['hsp_h'] = val; update=true) if(@ready and @hsp_limit[1] != val)
		@hsp_limit[1] = val
		return update
	end
	def update_csp_sb(val,cos)
		update = false
		(cos['csp_sb'] = val; update=true) if(@ready and @setback[0] != val)
		@setback[0] = val
		return update
	end
	def update_hsp_sb(val,cos)
		update = false
		(cos['hsp_sb'] = val; update=true) if(@ready and @setback[1] != val)
		@setback[1] = val
		return update
	end
	def update_sb_stat(val,cos)
		cos['sb_stat'] = val if(@ready and @sb_stat != val)
		@sb_stat = val
		#puts "update sb stat #{@sb_stat}"
	end
	def update_ch_master(val,cos)
		cos['ch_master'] = val if(@ready and @ch_master != val)
		@ch_master = val
	end
	def update_mode(val,cos,time)
		cos['mode'] = val if(@ready and @mode != val)
		@mode = val
	end
	def update_actual_mode(val,cos,time)
		if(@ready and @actual_mode != val)
			cos['actual_mode'] = val 
			restart_count(time)
		end
		@actual_mode = val
	end
	def update_fanstep(val,cos)
#		puts "**** #{val}, #{@fstep_auto}, #{@fstep_com}" if(id == "ha001-00001")
		if(@self_fanstep_auto == true && val != 'auto')
			if(@fstep_com == val)
				@fstep_auto = val
				@fstep_com = nil
				@fstep_block = false
				@com_timer = nil
#				puts "***** Block clear"
				return
			elsif(@fstep_auto != val || (@com_timer != nil && Time.now-@com_timer > 60))	# R/C operation
#				puts "*** exit auto #{@fstep_auto}, #{val}, #{@com_timer}, #{Time.now}"
				@self_fanstep_auto = false
				@fstep_auto = nil
				@fstep_com = nil
				@fstep_block = false
				@com_timer = nil
			end
			@com_timer = Time.now if(@fstep_block == true && @com_timer == nil)
			return if(@fstep_auto == val)
		end
		cos['fanstep'] = val if(@ready and @fanstep != val)
		@fanstep = val
	end
	def update_flap(val,cos)
		cos['flap'] = val if(@ready and @flap != val)
		@flap = val
	end
	def update_filter(val,cos)
		cos['filter'] = val if(@ready and @filter_sign != val)
		@filter_sign = val
	end
	def update_th_stat(val,cos,time)
		if(@ready and @th_stat != val)
			cos['th_stat'] = val 
			th_start_count(time) if(val == 'on')
			th_stop_count(time) if(val == 'off')
		end
		@th_stat = val
	end
	def update_defrost(val,cos)
		cos['defrost'] = val if(@ready and @defrost != val)
		@defrost = val
	end
	def update_thermo_err(val,cos)
		cos['thermo_err'] = val if(@ready and @thermo_err != val)
		@thermo_err = val
	end
	def update_temp(val,cos)
		cos['temp'] = val if(@ready and @temp != val)
		@temp = val
	end
	def update_temp_avail(val,cos)
		cos['temp_avail'] = val if(@ready and @temp_avail != val)
		@temp_avail = val
	end
	def update_rc_proh_stat(val,cos)
		cos['rc_proh_stat'] = val if(@ready and @rc_proh[0] != val)
		@rc_proh[0] = val
	end
	def update_rc_proh_sp(val,cos)
		cos['rc_proh_sp'] = val if(@ready and @rc_proh[1] != val)
		@rc_proh[1] = val
	end
	def update_rc_proh_mode(val,cos)
		cos['rc_proh_mode'] = val if(@ready and @rc_proh[2] != val)
		@rc_proh[2] = val
	end

	def operate_by_cos(cos)
		command = super(cos)
		check_dual_sp(cos,command)
		check_sp_limit(cos,command)
		setback_operation(cos,command)
		auto_fanstep_control(cos,command)
		return command
	end

	def auto_fanstep_control(cos,command)
		return command if(@self_fanstep_auto == false)

		return fanstep_control(command) if(cos['fanstep'] == 'auto' || cos['temp'] != nil || cos['sp'] != nil || cos['csp'] != nil || cos['hsp'] != nil)
	end

	def fanstep_control(command)
#		puts "******** block #{@fstep_block}"
		return command if(@fstep_block == true)
#		puts "***** Control FAN #{@temp} #{@fstep_auto}, #{@auto_start}"
		if(@actual_mode == 'cool')
			if((@csp+0.5 > @temp) && (@auto_start == true || @fstep_auto != 'L')) 
				command['fanstep'] = 'L' 
				@fstep_com = 'L'
				@auto_start = false
				@fstep_block = true
			elsif((@csp+2 < @temp) && (@auto_start == true || @fstep_auto != 'H')) 
				command['fanstep'] = 'H' 
				@fstep_com = 'H'
				@auto_start = false
				@fstep_block = true
			elsif(@fansteps == 2 && (@auto_start == true || @fstep_auto != 'H')) 
				command['fanstep'] = 'H' 
				@fstep_com = 'H'
				@auto_start = false
				@fstep_block = true
			elsif((@csp+0.5 <= @temp) && (@csp+2 >= @temp) && (@auto_start == true || @fstep_auto != 'M'))
				command['fanstep'] = 'M' 
				@fstep_com = 'M'
				@auto_start = false
				@fstep_block = true
			end
		elsif(@actual_mode == 'heat')
			if((@csp-0.5 < @temp) && (@auto_start == true || @fstep_auto != 'L')) 
				command['fanstep'] = 'L' 
				@fstep_com = 'L'
				@auto_start = false
				@fstep_block = true
			elsif((@csp-2 > @temp) && (@auto_start == true || @fstep_auto != 'H')) 
				command['fanstep'] = 'H' 
				@fstep_com = 'H'
				@auto_start = false
				@fstep_block = true
			elsif(@fansteps == 2 && (@auto_start == true || @fstep_auto != 'H')) 
				command['fanstep'] = 'H' 
				@fstep_com = 'H'
				@auto_start = false
				@fstep_block = true
			elsif((@csp-0.5 >= @temp) && (@csp-2 <= @temp) && (@auto_start == true || @fstep_auto != 'M'))
				command['fanstep'] = 'M' 
				@fstep_com = 'M'
				@auto_start = false
				@fstep_block = true
			end
		end
		return command
	end

	def check_dual_sp(cos,command)
		if(cos['actual_mode'] == nil)
			# mode is not changed
			@csp_com = cos['csp'] if(cos['csp'] != nil and @sb_stat == 'off')
			@hsp_com = cos['hsp'] if(cos['hsp'] != nil and @sb_stat == 'off')
		elsif(@sp_mode == 'dual')
			if(@actual_mode == 'cool')
				if(@hsp == cos['csp'])
					command['sp'] = @csp_com 
				else
					@csp_com = cos['csp'] if(cos['csp'] != nil)
				end
#				command['stat'] = 'off' if(@sb_stat == 'on')
			elsif(@actual_mode == 'heat')
				if(@csp == cos['hsp']) 	
					command['sp'] = @hsp_com
				else
					@hsp_com = cos['hsp'] if(cos['hsp'] != nil)
				end
#				command['stat'] = 'off' if(@sb_stat == 'on')
			end
			# it will stop if mode is changed during setback operation
		end
	end

	def check_sp_limit(cos,command)
		stat = {}
		# check set point
		# during setback limit wil be ignored
		csp = nil
		if(@csp != nil)
			if(@csp_limit_valid == true and @sb_stat == 'off')
				csp = @csp_limit[0] if(@csp < @csp_limit[0])
				csp = @csp_limit[1] if(@csp > @csp_limit[1])
			elsif(@csp < @csp_range[0]) 
				csp = @csp_range[0]
			elsif(@csp > @csp_range[1]) 
				csp =  @csp_range[1]
			end
			get_dev_com_csp(csp,nil,command,stat) if(csp != nil)
			update_csp(stat['csp'],cos) if(stat['csp'] != nil) 
		end
		hsp = nil
		if(@hsp != nil)
			if(@hsp_limit_valid == true and @sb_stat == 'off')
				hsp = @hsp_limit[0] if(@hsp < @hsp_limit[0])
				hsp = @hsp_limit[1] if(@hsp > @hsp_limit[1])
			elsif(@hsp < @hsp_range[0]) 
				hsp = @hsp_range[0]
			elsif(@hsp > @hsp_range[1]) 
				hsp =  @hsp_range[1]
			end
			get_dev_com_hsp(hsp,nil,command,stat) if(hsp != nil)
			update_hsp(stat['hsp'],cos) if(stat['hsp'] != nil) 
		end
	end

	def setback_operation(cos,command)
		if(@sb_stat == 'off' and @stat == 'off')
			# setback start condition check
			if(@actual_mode == 'cool' and @setback[0] != nil)
				if(@setback[0] < @temp)
					# cooling setback start
					start_setback(@setback[0],cos,command)
				end
			elsif(@actual_mode == 'heat' and @setback[1] != nil)
				if(@setback[1] > @temp)
					# heating setback start
					start_setback(@setback[1],cos,command)
				end
			end
		elsif(@sb_stat == 'on' and @stat == 'on')
			# setback stop condition check
			# during setback operation
			if(cos['actual_mode'] != nil) # if mode is changed during setback
				# quit setback mode
				command.update({'stat'=>'off'})
				@sb_stat = 'off'
				cos['sb_stat'] = 'off'
				cos['csp'] = @csp_com if(@csp != @csp_com)
				@csp = @csp_com
				cos['hsp'] = @hsp_com if(@hsp != @hsp_com)
				@hsp = @hsp_com
				@sb_timer = nil
			elsif(cos['csp'] != nil && cos['csp'] != @setback[0]-1)
				return if(@setback[0] > @csp_range[1] && cos['csp'] == @csp_range[1])	# for setback
				# if sp is changed during setback then quit setback
				if(@actual_mode == 'cool')
					if($model.start_with?("SVM-S2") || $model.start_with?("SVM-S3"))
						command.update({'sp'=>@setback[0]-1})
					else
						@sb_stat = 'off'
						cos['sb_stat'] = 'off'
						@sb_timer = nil
					end
				end
			elsif(cos['hsp'] != nil and cos['hsp'] != @setback[1]+1)
				return if(@setback[1] < @hsp_range[0] && cos['hsp'] == @hsp_range[0])	# for setback
				# if sp is changed during setback then quit setback
				if(@actual_mode == 'heat')
					if($model.start_with?("SVM-S2") || $model.start_with?("SVM-S3"))
						command.update({'sp'=>@setback[1]+1})
					else
						@sb_stat = 'off'
						cos['sb_stat'] = 'off'
						@sb_timer = nil
					end
				end
			elsif((cos.has_key?('csp_sb')) || (cos.has_key?('hsp_sb')))
				# during setback operation, it will stop when setback sp is cleared
				end_setback(@csp_com,cos,command) if(@actual_mode == 'cool')
				end_setback(@hsp_com,cos,command) if(@actual_mode == 'heat')
			elsif(@actual_mode == 'cool')
				if(@csp - 1 > @temp)
					if(@sb_timer == nil)
						@sb_timer = @clock.get_time 
					elsif(@clock.get_time-@sb_timer > @sb_stop_duration || @csp-@sb_stop_cond > @temp)
						# setback is finish
						end_setback(@csp_com,cos,command)
					end
				else
					@sb_timer = nil
				end
			elsif(@actual_mode == 'heat')
				if(@hsp + 1 < @temp)
					if(@sb_timer == nil)
						@sb_timer = @clock.get_time 
					elsif(@clock.get_time-@sb_timer > @sb_stop_duration || @hsp+@sb_stop_cond < @temp)
						# setback is finish
						end_setback(@hsp_com,cos,command)
					end
				else
					@sb_timer = nil
				end
			end
		elsif(@sb_stat == 'on' and cos['stat'] == 'off')
			end_setback_by_operation(command,{})
			@sb_stat = 'off'
			@sb_timer = nil
		end
	end
	def start_setback(sp,cos,command)
		puts "Start Setback"
		sp -= 1 if(@actual_mode == 'cool')
		sp += 1 if(@actual_mode == 'heat')
		# change setback setpoint for start thermo-on at setback setpoint
		sp = @csp_range[1] if(@actual_mode == 'cool' && sp > @csp_range[1])
		sp = @hsp_range[0] if(@actual_mode == 'heat' && sp < @hsp_range[0])
		command.update({'stat'=>'on','sp'=>sp})
		@sb_stat = 'on'
		cos['sb_stat'] = 'on'
	end
	def end_setback(sp,cos,command)
		puts "End Setback"
		command.update({'stat'=>'off','sp'=>sp})
		@sb_stat = 'off'
		cos['sb_stat'] = 'off'
		@sb_timer = nil
	end
	def end_setback_by_operation(com,stat)
		puts "End Setback by operation"
		com['sp'] = @csp_com
		com['sp'] = @hsp_com if(@actual_mode == 'heat')
		stat['sb_stat'] = 'off'
	end

	def stop_count(time)
		return if(@start_time == nil)
		@cool_op_time += (time-@start_time) if(@actual_mode == 'cool')
		@heat_op_time += (time-@start_time) if(@actual_mode == 'heat')
		@fan_op_time += (time-@start_time) if(@actual_mode == 'fan')
		@start_time = nil
	end
	def th_start_count_if_on(time)
		@th_start_time = time if(@th_stat == 'on')
	end
	def th_start_count(time)
		@th_start_time = time
	end
	def th_stop_count(time)
		@th_on_time += (time-@th_start_time) if(@th_start_time != nil)
		@th_start_time = nil
	end

	def store_sample_value(time,db)
		if(@temp_data)
			db.add_analog(id,"rt",time,@temp) if(@temp_avail == true)
			db.add_analog(id,"sp",time,@csp) if(@csp != nil and @actual_mode == 'cool')
			db.add_analog(id,"sp",time,@hsp) if(@hsp != nil and @actual_mode == 'heat')
		end
	end
	def store_running_data(time,db)
		restart_count(time)

		if(@th_stat != nil)
			th_stop_count(time)
			th_start_count_if_on(time)
		end

		# add data to database
		db.add_optime(id,time,@cool_op_time+@heat_op_time+@fan_op_time,@cool_op_time,@heat_op_time,@fan_op_time,@th_on_time)
		db.add_ontimes(id,time,@on_times)

		# clear accumulated value
		@cool_op_time = 0
		@heat_op_time = 0
		@fan_op_time = 0
		@th_on_time = 0
		@on_times = 0
	end

	# status initialization from database
	def set_init_status(stat)
		super
		stat.each do |key, val|
			case key
			when 'sp_mode'
				@sp_mode = val
			when 'csp'
				@csp = val
				@csp_com = val
			when 'hsp'
				@hsp = val
				@hsp_com = val
			when 'csp_limit_valid'
				@csp_limit_valid = val
			when 'csp_l'
				@csp_limit[0] = val
			when 'csp_h'
				@csp_limit[1] = val
			when 'hsp_limit_valid'
				@hsp_limit_valid = val
			when 'hsp_l'
				@hsp_limit[0] = val
			when 'hsp_h'
				@hsp_limit[1] = val
			when 'csp_sb'
				@setback[0] = val
			when 'hsp_sb'
				@setback[1] = val
			end
		end
		@ch_master = @ch_master_f 
	end

#	def set_off_timer(cos,time,clock)
		# if off timer is turn off or unit is turn off or off duration is changed then off command in timer should be clear
#		if(@ready == true and @off_timer_command[0] != nil and ((@off_timer == 'on' and cos['stat'] == 'off') or (@stat == 'on' and cos['off_timer'] == 'off') or (@off_timer == 'on' and @stat == 'on' and cos['off_duration'] != nil)))
#			clock.cancel_action(@off_timer_command[0].hour,@off_timer_command[0].min,@off_timer_command[1],'offtimer') 
#		end

		# if off timer turn on and unit is on then set off command in timer
		# if off timer is on and unit is turn on then set off command in timer
		# if off duration is changed then re-set off command
#		if(@sb_stat == 'off' and ((cos['off_timer'] == 'on' and (cos['stat'] == 'on' or @stat == 'on')) or (cos['stat'] == 'on' and @off_timer == 'on') or (@stat == 'on' and @off_timer == 'on' and (cos['off_duration'] != nil or cos['sb_stat'] == 'off')) or (@ready == false and @off_timer == 'on' and @stat == 'on')))
#			@off_timer_command[0] = time+@off_duration*60
#			clock.add_action(@off_timer_command[0].hour,@off_timer_command[0].min, @off_timer_command[1],'offtimer') 
#		end
#	end

	# private method
	def update_dual_sp(sp, cos, mode)
		key = nil
		return key if(@ready == false)
		mode_change = false 
		mode_change = true if(cos != nil or mode != @actual_mode)
		mode = @actual_mode if(mode == nil)
		if(mode == 'cool')
			if(@csp != sp) # or mode_change == false))	
				key = 'csp' 
				@csp = sp
				@csp_com = sp if(@csp_com == nil)
			end
			if(@hsp == nil)	# for initialize
				@hsp = sp
				@hsp_com = sp if(@hsp_com == nil)
			end
		elsif(mode == 'heat')
			if(@hsp != sp) # or mode_change == false))
				key = 'hsp' 
				@hsp = sp
				@hsp_com = sp if(@hsp_com == nil) 	# for initialize
			end
			if(@csp == nil)	# for initialize
				@csp = sp
				@csp_com = sp if(@csp_com == nil)
			end
		end
		key
	end
end
