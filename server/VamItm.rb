#coding: utf-8

require_relative 'Vam'

class VamItm < Vam
	def set_dev_attr(attr)
		@ppd_target = true if(attr[3] == 0)
		@vmode_cap = ''
		@vmode_cap += 'A' if((attr[7] & 1) != 0)
		@vmode_cap += 'H' if((attr[7] & 2) != 0)
		@vmode_cap += 'B' if((attr[7] & 4) != 0)
		@vamount_cap = ''
		@vamount_cap += 'A' if((attr[8] & 9) != 0)
		@vamount_cap += 'L' if((attr[8] & 0x12) != 0)
		@vamount_cap += 'H' if((attr[8] & 0x24) != 0)
		@vamount_cap += 'F' if((attr[8] & 0x38) != 0)
		@manual_op_cap = false if(attr[9] == 1)
		@rc_master = false if(attr[10] == 1)
		@rc_proh_cap = true
	end
end
