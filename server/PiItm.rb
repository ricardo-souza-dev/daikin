#coding: utf-8

require_relative 'Pi'

class PiItm < Pi
	def set_dev_attr(attr)
		@unit_label = attr[5]
	end		
end
