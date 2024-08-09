#coding: utf-8

require_relative 'Fcu'

class FcuItc < Fcu
	def initialize(pid,dev_id)
		super
		@sp_cap = true
		@sp_step = 0.1
		@csp_range = [16,32]
		@hsp_range = [16,32]
		@mode_cap = 'FHCD'
		@fansteps = 3
		@fanstep_cap = true
		@fanstep_auto_cap = false
		@flap_cap = true
		@manual_op_cap = true
		@rc_master = true
		@rc_proh_cap = false
		@csp_limit = [16,32]
		@hsp_limit = [16,32]
		@ch_master_f = nil
	end

	def attribute
		super.merge({'ch_master'=>@ch_master_f})
	end

	# device layer method
	# point information update from device info
	# attr is hash
	def set_attr(attr)
		super
		if(attr['ch_master'] != nil)
			@ch_master_f = attr['ch_master'] 
			@ch_master = @ch_master_f
			puts "ch_master #{@ch_master_f}"
		end
	end

	def update_ch_master(val,cos)
		return if( @ch_master_f != nil)
		cos['ch_master'] = val if(@ready and @ch_master != val)
		@ch_master = val
	end

	def update_fanstep(val,cos)
		val = 'H' if(@fansteps == 2 and val == 'M')
		cos['fanstep'] = val if(@ready and @fanstep != val)
		@fanstep = val
	end

	def check_rc_proh_stat(val,com,stat)
	end
	def check_rc_proh_sp(val,com,stat)
	end
	def check_rc_proh_mode(val,com,stat)
	end
end
