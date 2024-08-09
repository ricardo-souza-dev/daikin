#coding: utf-8

require_relative 'Fcu'

class FcuItm < Fcu
	# set attribute from iTM to this point
	def set_dev_attr(attr)
		@ppd_target = true if(attr[3] == 0)
		@sp_cap = true if(attr[6] == 1)
		@sp_step = attr[11]
		@csp_range = [attr[8],attr[7]]
		@hsp_range = [attr[10],attr[9]]
		@csp_limit[0] = @csp_range[0] if(@csp_limit[0] == nil)
		@csp_limit[1] = @csp_range[1] if(@csp_limit[1] == nil)
		@hsp_limit[0] = @hsp_range[0] if(@hsp_limit[0] == nil)
		@hsp_limit[1] = @hsp_range[1] if(@hsp_limit[1] == nil)
		@mode_cap = ''
		@mode_cap += 'F' if((attr[5] & 0x1) != 0)
		@mode_cap += 'H' if((attr[5] & 0x2) != 0)
		@mode_cap += 'C' if((attr[5] & 0x4) != 0)
		@mode_cap += 'D' if((attr[5] & 0x40) != 0)
		@mode_cap += 'A' if((attr[5] & 0x200) != 0)
		@fansteps = 2 if(attr[16] == 1 or attr[16] == 101)
		@fansteps = 3 if(attr[16] == 2 or attr[16] == 102)
		@fanstep_cap = true if(attr[16] != 0)
		@fanstep_auto_cap = true if(attr[16] > 100)
		@flap_cap = true if(attr[17] == 1)
		@manual_op_cap = false if(attr[12] == 1)
		@rc_master = false if(attr[15] == 1)
	end

	def update_fanstep(val,cos)
		val = 'H' if(@fansteps == 2 and val == 'M')
		cos['fanstep'] = val if(@ready and @fanstep != val)
		@fanstep = val
	end

	def check_csp_limit_valid(val,com,stat,command)
		return if(@sp_cap == false)
		if(val != @csp_limit_valid)
			com['csp_limit_valid'] = val 
			com['csp_l'] = @csp_limit[0] if(command['csp_l'] == nil)
			com['csp_h'] = @csp_limit[1] if(command['csp_h'] == nil)
		end
	end
	def check_csp_l(val,com,stat,command)
		return if(@sp_cap == false)
		val = @csp_range[0] if(val < @csp_range[0])
		val = @csp_range[1] if(val > @csp_range[1])
		if(val != @csp_limit[0])
			com['csp_l'] = val 
			com['csp_h'] = @csp_limit[1] if(command['csp_h'] == nil)
			com['csp_limit_valid'] = @csp_limit_valid if(command['csp_limit_valid'] == nil )
		end
	end
	def check_csp_h(val,com,stat,command)
		return if(@sp_cap == false)
		val = @csp_range[0] if(val < @csp_range[0])
		val = @csp_range[1] if(val > @csp_range[1])
		if(val != @csp_limit[1])
			com['csp_h'] = val 	
			com['csp_l'] = @csp_limit[0] if(command['csp_l'] == nil)
			com['csp_limit_valid'] = @csp_limit_valid if(command['csp_limit_valid'] == nil)
		end
	end
	def check_hsp_limit_valid(val,com,stat,command)
		return if(@sp_cap == false)
		if(val != @hsp_limit_valid)
			com['hsp_limit_valid'] = val 
			com['hsp_l'] = @hsp_limit[0] if(command['hsp_l'] == nil)
			com['hsp_h'] = @hsp_limit[1] if(command['hsp_h'] == nil)
		end
	end
	def check_hsp_l(val,com,stat,command)
		return if(@sp_cap == false)
		val = @hsp_range[0] if(val < @hsp_range[0])
		val = @hsp_range[1] if(val > @hsp_range[1])
		if(val != @hsp_limit[0])
			com['hsp_l'] = val 
			com['hsp_h'] = @hsp_limit[1] if(command['hsp_h'] == nil)
			com['hsp_limit_valid'] = @hsp_limit_valid if(command['hsp_limit_valid'] == nil )
		end
	end
	def check_hsp_h(val,com,stat,command)
		return if(@sp_cap == false)
		val = @hsp_range[0] if(val < @hsp_range[0])
		val = @hsp_range[1] if(val > @hsp_range[1])
		if(val != @hsp_limit[1])
			com['hsp_h'] = val 
			com['hsp_l'] = @hsp_limit[0] if(command['hsp_l'] == nil)
			com['hsp_limit_valid'] = @hsp_limit_valid if(command['hsp_limit_valid'] == nil)
		end
	end

#	def get_snapshot
#		{'sp_mode'=>@sp_mode,'csp'=>@csp,'hsp'=>@hsp,'csp_sb'=>@setback[0],'hsp_sb'=>@setback[1],'off_timer'=>@off_timer,'off_duration'=>@off_duration,'cool_op_time'=>@cool_op_time,'heat_op_time'=>@heat_op_time,'fun_op_time'=>@fan_op_time,'th_on_time'=>@th_on_time}
#	end

end
