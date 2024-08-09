#coding: utf-8

require_relative 'Hydrobox'

class HydroboxItm < Hydrobox
	# set attribute from iTM to this point
	def set_dev_attr(attr)
		@ppd_target = true if(attr[3] == 0)
		@sp_cap = true if(attr[6] == 1)
		@sp_step = attr[11]
		@csp_range = [attr[8],attr[7]]
		@hsp_range = [attr[10],attr[9]]
		@mode_cap = ''
		@mode_cap += 'H' if((attr[5] & 0x2) != 0)
		@mode_cap += 'C' if((attr[5] & 0x4) != 0)
		@manual_op_cap = false if(attr[12] == 1)
		@rc_master = false if(attr[15] == 1)
		@ac_op_cap = true if(attr[16] == 1)
		@wsp_cap = true if(attr[17] == 1)
		@wsp_step = attr[18]
		@wcsp_range = [attr[20],attr[19]]
		@whsp_range = [attr[22],attr[21]]
		@wreh_cap = true if(attr[23] == 1)
		@low_noize_cap = true if(attr[24] == 1)
	end
end
