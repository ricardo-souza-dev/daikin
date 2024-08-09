#coding: utf-8

require_relative 'Ai'

class AiItm < Ai
	def set_dev_attr(attr)
		@ppd_target = true if(attr[3] == 0)
		@unit_label = attr[5]
	end		
end

class AoItm < Ao
	def set_dev_attr(attr)
		@ppd_target = true if(attr[3] == 0)
		@unit_label = attr[5]
		@ao_range = [attr[7],attr[8]]
		@ao_step = (10**attr[9]).to_f
		@manual_op_cap = false if(attr[6] == 1)
	end		
end