#coding: utf-8

require_relative 'ManagementPoint'

class MSi < ManagementPoint
	def initialize(pid, dev_id)
		super
		@tag = ['','','','','','','','','','']
		@icon='MSI.png'
		# status
		@ms_val = nil
	end

	def point_type
		'MSi'
	end

	# get_attribute relate method
	def attribute
		super.merge({'tag'=>@tag})
	end

	# get_status relate method
	def current_status
		super.merge({'ms_val'=>@ms_val})
	end

	# set_attribute relate method
	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'tag'
				@tag = val
			end
		end
	end

	# update_status relate method
	def update_ms_val(val,cos)
		cos['ms_val'] = val if(@ready and @ms_val != val)
		@ms_val = val
	end
end

class MSo < MSi
	def initialize(pid, dev_id)
		super
		@manual_op_cap = true
	end

	def point_type
		'MSo'
	end
	
		# get_attribute relate method
	def attribute
		super.merge({'manual_op_cap'=>@manual_op_cap})
	end

	# set_attribute relate method
	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'manual_op_cap'
				@manual_op_cap = val
			end
		end
	end

	# operation relate method
	def check_ms_val(val,com,stat)
		com['ms_val'] = val #if(val != @ms_val)
	end
end