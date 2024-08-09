#coding: utf-8

require_relative 'Dio'

class Vam < Dio
	def initialize(pid,dev_id)
		super
		# attribute of point
		@icon = 'VAM.png'
		@vmode_cap = ''
		@vamount_cap = ''
		@manual_op_cap = true
		@rc_master = true
		@rc_proh_cap = true

		# point status
		@forced_off = nil
		@filter_sign = false
		@rc_proh = ['permit']
		@vmode = nil
		@vamount = nil
		@fresh_up = nil
	end

	def point_type
		'Vam'
	end
	
	# get_attribute relate method
	def attribute
		super.merge({'vmode_cap'=>@vmode_cap,'vamount_cap'=>@vamount_cap,'rc_master'=>@rc_master,'rc_proh_cap'=>@rc_proh_cap})
	end

	# get_status relate method
	def current_status
		super.merge({'forced_off'=>@forced_off,'filter'=>@filter_sign,'rc_proh_stat'=>@rc_proh[0],'vmode'=>@vmode,'vamount'=>@vamount,'fresh_up'=>@fresh_up})
	end

	# set_attribute relate method
	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'vmode_cap'
				@vmode_cap = val
			when 'vamount_cap'
				@vamount_cap = val
			when 'rc_master'
				@rc_master = val
			when 'rc_proh_cap'
				@rc_proh_cap = val
			end
		end
	end

	# operation relate method
	def check_vmode(val,com,stat)
		return if(@vmode_cap.index(val[0].upcase) == nil)
		com['vmode'] = val #if(val != @vmode)
	end
	def check_vamount(val,com,stat)
		return if(@vamount_cap.index(val[0].upcase) == nil)
		com['vamount'] = val #if(val != @vamount)
		com['fresh_up'] = @fresh_up if(com['fresh_up'] == nil)
	end
	def check_fresh_up(val,com,stat)
		return if(@vamount_cap.index('F') == nil)
		if(val != @fresh_up)
			com['vamount'] = @vamount if(com['vamount'] == nil)
			com['fresh_up'] = val 
		end
	end
	def check_filter_clr(val,com,stat)
		com['filter_clr'] = val if(val ==true)
	end
	def check_rc_proh_stat(val,com,stat)
		com['rc_proh_stat'] = val #if(val != @rc_proh[0])
	end

	# update_status relate method
	def update_forced_off(val,cos)
		cos['forced_off'] = val if(@ready and @forced_off != val)
		@forced_off = val
	end
	def update_filter(val,cos)
		cos['filter'] = val if(@ready and @filter_sign != val)
		@filter_sign = val
	end
	def update_rc_proh_stat(val,cos)
		cos['rc_proh_stat'] = val if(@ready and @rc_proh[0] != val)
		@rc_proh[0] = val
	end
	def update_vmode(val,cos)
		cos['vmode'] = val if(@ready and @vmode != val)
		@vmode = val
	end
	def update_vamount(val,cos)
		cos['vamount'] = val if(@ready and @vamount != val)
		@vamount = val
	end
	def update_fresh_up(val,cos)
		cos['fresh_up'] = val if(@ready and @fresh_up != val)
		@fresh_up = val
	end
end