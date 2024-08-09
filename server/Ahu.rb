# coding: utf-8

require_relative 'Fcu'

class Ahu < Fcu
	def initialize(pid, dev_id)
		super(pid, dev_id)
		@icon = 'AHU.png'
		# attribute of point
		@mode_cap = 'C'
		@rc_proh_cap = false
		@out_cap = true
	end

	def point_type
		'Ahu'
	end
	
	def attribute
		super.merge({'out_cap'=>@out_cap})
	end

	# device layer method
	# point information update from device info
	# attr is hash
	def set_attr(attr)
		super
		attr.each do |key, val|
			case key
			when 'out_cap'
				@out_cap = val
			end
		end
	end

	# these method should be overwrite in sub class
	def check_stat(val,com,stat)
		com['stat'] = val if(@out_cap == true)
	end
	def check_fanstep(val,com,stat)
	end
	def check_flap(val,com,stat)
	end
	def check_filter_clr(val,com,stat)
	end
	def check_rc_proh_stat(val,com,stat)
	end
	def check_rc_proh_sp(val,com,stat)
	end
	def check_rc_proh_mode(val,com,stat)
	end

	# status update from device
	def update_ch_master(val,cos)
	end
	def update_fanstep(val,cos)
	end
	def update_flap(val,cos)
	end
	def update_filter(val,cos)
	end
	def update_th_stat(val,cos,time)
	end
	def update_defrost(val,cos)
	end
	def update_thermo_err(val,cos)
	end
	def update_temp_avail(val,cos)
	end
	def update_rc_proh_stat(val,cos)
	end
	def update_rc_proh_sp(val,cos)
	end
	def update_rc_proh_mode(val,cos)
	end

end