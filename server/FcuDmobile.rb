#coding: utf-8

require_relative 'Fcu'

class FcuDmobile < Fcu
	def initialize(pid,dev_id)
		super
		@icon = 'FXAQ.png'
		@housekeeping_cap = [false,false]
		@powerful_cap = [false,false]
		@morning_heat_cap = [false,false]
		@high_temp_heater_cap = [false,false]
		@comfort_airflow_cap = [false,false]
		@quiet_mode_cap = [false,false]
		@quick_heater_cap = [false,false]
		@sleep_mode_cap = [false,false]
		@rc_proh_cap = false
		@fan_quiet_cap = false
		@flap_auto_cap = false
		@flap2_cap = false
		@flap_auto_cap = false
		@flap2_auto_cap = false
		@outdoor_temp_cap = false
		@power_cap = false
		@separate_power_cap = false
		@demand_cap = false
		@hum_ctrl_mode_cap =''
		@beauty_skin_cap = [false,false]
		@defrost_cap = [false,false]
		@streamer_cap = [false,false]
		@econo_cap = [false,false]

		@flap2 = nil
		@powerful = nil
		@hum_sp = nil
		@flap_steps = 0
		
		@forced_off = false

		@actual_mode = 'cool'	# default value because of D-Mobile bug
	end

	attr_reader :actual_mode, :csp, :hsp, :sp

	def auto_enable?
		return @mode_cap.include?('A')
	end

	def attribute
		super.merge({'flap_auto_cap'=>@flap_auto_cap,'flap2_cap'=>@flap2_cap,'flap2_auto_cap'=>@flap2_auto_cap,'powerful_cap'=>@powerful_cap})
	end

	def current_status
		super.merge({'flap2'=>@flap2,'powerful'=>@powerful})
	end

	def check_rc_proh_stat(val,com,stat)
	end
	def check_rc_proh_sp(val,com,stat)
	end
	def check_rc_proh_mode(val,com,stat)
	end

	def check_flap2(val,com,stat)
		return if(@flap2_cap == false)
		if(val == 'swing')
			com['flap2'] = val if(val != @flap2)
		else
			com['flap2'] = 0 if(val.to_i != @flap2)
		end
	end
	def check_powerful(val,com,stat)
		return if(@powerful_cap == false)
		com['powerful'] = val if(val != @powerful)
	end
	def check_hum_sp(val,com,stat)
		return if(@hum_set_cap == false)
		com['hum_sp'] = val
	end

	def update_flap2(val,cos)
		cos['flap2'] = val if(@ready and @flap2 != val)
		@flap2 = val
	end
	def update_powerful(val,cos)
		cos['powerful'] = val if(@ready and @powerful != val)
		@powerful = val
	end
	def update_hum_sp(val,cos)
		cos['hum_sp'] = val if(@ready and @hum_sp != val)
		@hum_sp = val
	end

	def set_dev_attr(attr)
		@mode_cap = ''
		@mode_cap += 'F' if((attr[0] & 0x8) != 0)
		@mode_cap += 'C' if((attr[0] & 0x2) != 0)
		@mode_cap += 'H' if((attr[0] & 0x4) != 0)
		@mode_cap += 'A' if((attr[0] & 0x1) != 0)
		@mode_cap += 'D' if((attr[0] & 0x10) != 0)
		@mode_cap += 'S' if((attr[0] & 0x20) != 0)	# Humidifire
		#special mode
		@housekeeping_cap[0] = true if((attr[1] & 0x1) != 0)
		@housekeeping_cap[1] = true if((attr[1] & 0x2) != 0)
		@powerful_cap[0] = true if((attr[1] & 0x4) != 0)
		@powerful_cap[1] = true if((attr[1] & 0x8) != 0)
		@morning_heat_cap[0] = true if((attr[1] & 0x10) != 0)
		@morning_heat_cap[1] = true if((attr[1] & 0x20) != 0)
		@high_temp_heater_cap[0] = true if((attr[1] & 0x40) != 0)
		@high_temp_heater_cap[1] = true if((attr[1] & 0x80) != 0)
		@comfort_airflow_cap[0] = true if((attr[1] & 0x100) != 0)
		@comfort_airflow_cap[1] = true if((attr[1] & 0x200) != 0)
		@quiet_mode_cap[0] = true if((attr[1] & 0x400) != 0)
		@quiet_mode_cap[1] = true if((attr[1] & 0x800) != 0)
		@quick_heater_cap[0] = true if((attr[1] & 0x1000) != 0)
		@quick_heater_cap[1] = true if((attr[1] & 0x2000) != 0)
		@sleep_mode_cap[0] = true if((attr[1] & 0x4000) != 0)
		@sleep_mode_cap[1] = true if((attr[1] & 0x8000) != 0)

		@fansteps = (attr[3]>>4) & 0xf
		@fanstep_cap = ((attr[3] & 0x1) != 0)
		@fanstep_auto_cap = ((attr[3] & 0x2) != 0)
		@fan_quiet = ((attr[3] & 0x4) != 0)
		@flap_cap = ((attr[4] & 0x1) != 0)
		@flap2_cap = ((attr[4] & 0x2) != 0)
		@flap_auto_cap = false #((attr[3] & 0x4) != 0)
		@flap2_auto_cap = false #((attr[3] & 0x8) != 0)

		@outdoor_temp_cap = ((attr[5] & 0x2) != 0)
		@power_cap = false #((attr[4] & 0x8) != 0)
		@separate_power_cap = false #((attr[4] & 0x10) != 0)
		@demand_cap = false #((attr[4] & 0x20) != 0)

		@hum_ctrl_mode_cap += 'A' if((attr[6] & 0x1) != 0)
		@hum_ctrl_mode_cap += 'C' if((attr[6] & 0x2) != 0)
		@hum_ctrl_mode_cap += 'H' if((attr[6] & 0x4) != 0)
		@hum_ctrl_mode_cap += 'F' if((attr[6] & 0x8) != 0)
		@hum_ctrl_mode_cap += 'D' if((attr[6] & 0x10) != 0)
		@hum_ctrl_mode_cap += 'S' if((attr[6] & 0x20) != 0)

		@beauty_skin_cap[0] = false #((attr[6] & 0x1) != 0)
		@beauty_skin_cap[1] = false #((attr[6] & 0x2) != 0)
		@defrost_cap[0] = false #((attr[6] & 0x4) != 0)
		@defrost_cap[1] = false #((attr[6] & 0x8) != 0)
		@streamer_cap[0] = false #((attr[6] & 0x10) != 0)
		@streamer_cap[1] = false #((attr[6] & 0x20) != 0)
		@econo_cap[0] = false #((attr[6] & 0x40) != 0)
		@econo_cap[1] = false #((attr[6] & 0x80) != 0)

		@csp_range = [attr[7]&0xff,(attr[7]>>8)&0xff]
		@hsp_range = [attr[8]&0xff,(attr[8]>>8)&0xff]
		if(@mode_cap.include?('C') == true)
			@csp_limit[0] = @csp_range[0] if(@csp_limit[0] == nil)
			@csp_limit[1] = @csp_range[1] if(@csp_limit[1] == nil)
		else
			@csp_limit[0] = nil
			@csp_limit[1] = nil
		end
		if(@mode_cap.include?('H') == true)
			@hsp_limit[0] = @hsp_range[0] if(@hsp_limit[0] == nil)
			@hsp_limit[1] = @hsp_range[1] if(@hsp_limit[1] == nil)
		else
			@hsp_limit[0] = nil
			@hsp_limit[1] = nil
		end
		@sp_cap = true
		@sp_cap = false if(@mode_cap == '')
		@sp_step = 0.5
		@manual_op_cap = true
		@rc_master = true
		@rc_proh_cap = false
	end

	def check_mode_cap
		return false
	end

	def check_demand_cap
		return false
	end
end
