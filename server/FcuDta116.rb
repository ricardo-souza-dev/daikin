#coding: utf-8

require_relative 'Fcu'

class FcuDta116 < Fcu
	def initialize(pid,dev_id)
		super
		@rc_proh_cap = false
	end

	def check_rc_proh_stat(val,com,stat)
		com['rc_proh_stat'] = val
	end
	def check_rc_proh_sp(val,com,stat)
	end
	def check_rc_proh_mode(val,com,stat)
	end

	def set_dev_attr(attr)
		# attr[0]: 31001 capabilities
		# attr[1]: 31002 csp upper/lower
		# attr[2]: 31003 hsp upper/lower
		@mode_cap = ''
		@mode_cap += 'F' if((attr[0] & 0b00000001) != 0)
		@mode_cap += 'C' if((attr[0] & 0b00000010) != 0)
		@mode_cap += 'H' if((attr[0] & 0b00000100) != 0)
		@mode_cap += 'A' if((attr[0] & 0b00001000) != 0)
		@mode_cap += 'D' if((attr[0] & 0b00010000) != 0)
		@flap_cap = false
		@flap_cap = true if(((attr[0] >> 11) & 1) != 0)
		@fansteps = ((attr[0] >> 12) & 0b0111)
		@fanstep_cap = false
		@fanstep_cap = true if((attr[0] & 0x8000) != 0)
		@csp_range = [(attr[1]>>8)&0xff,attr[1]&0xff]
		@hsp_range = [(attr[2]>>8)&0xff,attr[2]&0xff]
		@csp_limit[0] = @csp_range[0] if(@csp_limit[0] == nil)
		@csp_limit[1] = @csp_range[1] if(@csp_limit[1] == nil)
		@hsp_limit[0] = @hsp_range[0] if(@hsp_limit[0] == nil)
		@hsp_limit[1] = @hsp_range[1] if(@hsp_limit[1] == nil)

		@sp_cap = true
		@sp_cap = false if(@mode_cap == '')
		@sp_step = 0.1
		@fanstep_auto_cap = false
		@manual_op_cap = true
		@rc_master = true
		@rc_proh_cap = false
	end
end
