# coding: utf-8

require_relative 'FcuDta116'

class FcuDta116C < FcuDta116
	def initialize(pid, dev_id)
		super
		# @fanstep_auto_cap is overwritten
		@flap_auto_cap = false
		@std_vent_cap = false
		@auto_vent_cap = false
		@confort_cap = false
		@automoist_cap = false
		@sleep_cap = false
		@bath_dry_cap = false
		@pre_heat_cap = false
		@bath_vent_cap = false
		@hum_ctrl_cap = false
		@flap2_cap = false

		@vent_mode = nil	# NON,AUTO,AHX,STD
		@flap2 = nil
		@hum_mode = nil	# L,M,H
		@bath_vent_mode = nil	#STOP,L,H
	end

	def attribute
		super.merge({'flap_auto_cap'=>@flap_auto_cap,'std_vent_cap'=>@std_vent_cap,'auto_vent_cap'=>@auto_vent_cap,'confort_cap'=>@confort_cap,'automoist_cap'=>@automoist_cap,'sleep_cap'=>@sleep_cap,'bath_dry_cap'=>@bath_dry_cap,'pre_heat_cap'=>@pre_heat_cap,'bath_vent_cap'=>@bath_vent_cap,'hum_ctrl_cap'=>@hum_ctrl_cap,'flap2_cap'=>@flap2_cap})
	end


	def current_status
		super.merge({'vent_mode'=>@vent_mode,'flap2'=>@flap2,'hum_mode'=>@hum_mode,'bvmode'=>@bath_vent_mode})
	end

	# device layer method
	def set_dev_attr(attr)
		super
		@fanstep_auto_cap = true if((attr[0] & 0b01000000) != 0)
		@flap_auto_cap = true if((attr[0] & 0b10000000) != 0)
	end

	def set_dev_attr2(attr)
		@std_vent_cap = true if((attr[0] & 0b00000001) != 0)
		@auto_vent_cap = true if((attr[0] & 0b00000010) != 0)
		@confort_cap = true if((attr[0] & 0b0000000100000000) != 0)
		@automoist_cap = true if((attr[0] & 0b0000001000000000) != 0)
		@sleep_cap = true if((attr[0] & 0b0000010000000000) != 0)
		@bath_dry_cap = true if((attr[0] & 0b0000100000000000) != 0)
		@pre_heat_cap = true if((attr[0] & 0b0001000000000000) != 0)
		@bath_vent_cap = true if((attr[0] & 0b0010000000000000) != 0)
		@hum_ctrl_cap = true if((attr[0] & 0b0100000000000000) != 0)
		@flap2_cap = true if((attr[0] & 0b1000000000000000) != 0)
	end

	# point information update from device info
	# attr is hash
	def set_attr(attr)
		super
		attr.each do |key, val|
			case key
			when 'flap_auto_cap'
				@flap_auto_cap = val
			when 'std_vent_cap'
				@std_vent_cap = val
			when 'auto_vent_cap'
				@auto_vent_cap = val
			when 'confort_cap'
				@confort_cap = val
			when 'automoist_cap'
				@automoist_cap = val
			when 'sleep_cap'
				@sleep_cap = val
			when 'bath_dry_cap'
				@bath_dry_cap = val
			when 'pre_heat_cap'
				@pre_heat_cap = val
			when 'bath_vent_cap'
				@bath_vent_cap = val
			when 'hum_ctrl_cap'
				@hum_ctrl_cap = val
			when 'flap2_cap'
				@flap2_cap = val
			end
		end
	end

	def update_flap2(val,cos)
		cos['flap2'] = val if(@ready and @flap2 != val)
		@flap2 = val
	end

	def update_fvmode(val,cos)
		cos['fvmode'] = val if(@ready and @vent_mode != val)
		@vent_mode = val
	end

	def update_bvmode(val,cos)
		cos['bvmode'] = val if(@ready and @bath_vent_mode != val)
		@bath_vent_mode = val
	end

	def update_dehum_mode(val,cos)
		cos['dehum_mode'] = val if(@ready and @hum_mode != val)
		@hum_mode = val
	end

	def check_mode(val,sp_mode,com,stat)
		return if(val == 'confort' && @confort_cap == false)
		return if(val == 'automoist' && @automoist_cap == false)
		return if(val == 'sleep' && @sleep_cap == false)
#		return if(val == 'dry' && @bath_dry_cap == false)
		return if(val == 'pre_heat' && @pre_heat_cap == false)
		return if(val == 'fan' && @mode_cap.index('F') == nil)
		return if(val == 'cool' && @mode_cap.index('C') == nil)
		return if(val == 'heat' && @mode_cap.index('H') == nil)
		return if(val == 'temp' && @mode_cap.index('C') == nil && @mode_cap.index('H') == nil)
		return if(val == 'dry' && @mode_cap.index('D') == nil)
		return if(val == 'auto' && @mode_cap.index('A') == nil)

		if(val != @mode)
			com['mode'] = val 
			if(sp_mode == 'dual' or (sp_mode == nil and @sp_mode == 'dual'))
				if(val == 'cool' and com['sp'] == nil)
					com['sp'] = @csp_com if(@sb_stat == 'off')
					com['sp'] = @setback[0] if(@sb_stat == 'on')
				elsif(val == 'heat' and com['sp'] == nil) 	
					com['sp'] = @hsp_com if(@sb_stat == 'off')
					com['sp'] = @setback[1] if(@sb_stat == 'on')
				end
			end
		end

		com['mode'] = val if(val != @mode2)
	end

	def check_flap(val,com,stat)
		return if(@flap_cap == false)
		if(val == 'swing' || val == 'auto')
			com['flap'] = val if(val != @flap)
		else
			com['flap'] = val.to_i if(val.to_i != @flap)
		end
	end

	def check_flap2(val,com,stat)
		return if(@flap2_cap == false)
		if(val == 'swing')
			com['flap2'] = val if(val != @flap2)
		else
			com['flap2'] = val.to_i if(val.to_i != @flap2)
		end
	end

	def check_fvmode(val,com,stat)
		return if(val == 'auto' && @auto_vent_cap == false)
		return if(@std_vent_cap == false)
		com['fvmode'] = val if(val != @vent_mode)
	end

	def check_bvmode(val,com,stat)
		return if(@bath_vent_cap == false)
		com['bvmode'] = val if(val != @bath_vent_mode)
	end

	def check_dehum_mode(val,com,stat)
		return if(@hum_ctrl_cap == false)
		com['dehum_mode'] = val if(val != @hum_mode)
	end
end
