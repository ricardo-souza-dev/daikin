#coding: utf-8

require_relative 'Ahu'

class AhuItm < Ahu
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
		@out_cap = false if(attr[13] == 0)
	end
end
