#coing: utf-8

require_relative 'Dio'

class DiItm < Di
end

class DioItm < Dio
	def set_dev_attr(attr)
		@ppd_target = true if(attr[3] == 0)
		@manual_op_cap = false if(attr[5] == 1)
	end		
end