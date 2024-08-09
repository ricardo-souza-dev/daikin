#coding: utf-8

require_relative 'Chiller'

class ChillerItm < Chiller
	# set attribute from iTM to this point
	def set_dev_attr(attr)
		@ppd_target = true if(attr[3] == 0)
		@mode_cap = ''
		@mode_cap += 'H' if((attr[6] & 0x2) != 0)
		@mode_cap += 'C' if((attr[6] & 0x4) != 0)
		@manual_op_cap = false if(attr[5] == 1)
		if(attr[0] == 105)
			@wsp_cap = true if(attr[9] == 1)
			@wsp_step = attr[10]
			@dual_sp_cap = false
			@wcsp_range = [attr[12],attr[11]]
			@whsp_range = [attr[12],attr[11]]
		elsif(attr[0] == 108)
			@wsp_cap = true if(attr[9] == 1) 
			@wsp_step = attr[10]
			@dual_sp_cap = true
			@wcsp_range = [attr[12],attr[11]]
			@whsp_range = [attr[14],attr[13]]
			@low_noize_cap = true if(attr[16] == 1)
		elsif(attr[0] == 201)
			@wsp_cap = true if(attr[7] == 1) 
			@wsp_step = attr[8]
			@dual_sp_cap = true
			@wcsp_range = [attr[10],attr[9]]
			@whsp_range = [attr[12],attr[11]]
			@rc_proh_cap = false
			@out_cap = false if(attr[13] == 0)
		end
	end
end
