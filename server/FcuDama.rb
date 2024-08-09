#coding: utf-8

require_relative 'Fcu'

class FcuDama < Fcu
	def initialize(pid, dev_id)
		super
		# attribute of point
		@icon = 'FXAQ.png'
		@sp_cap = true
		@sp_step = 1
		@csp_range = [16,30]
		@hsp_range = [16,30]
		@mode_cap = 'CHFD'
		@fansteps = 3
		@fanstep_cap = true
		@fanstep_auto_cap = true
		@flap_cap = true
		@flap_steps = 0
		@rc_master = true
		@rc_proh_cap = false
		@ch_master_f = true
		@ch_master = true
	end
end
