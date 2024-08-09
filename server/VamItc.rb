#coding: utf-8

require_relative 'Vam'

class VamItc < Vam
	def initialize(pid,dev_id)
		super
		@vmode_cap = 'AHB'
		@vamount_cap = 'ALHF'
		@manual_op_cap = true
		@rc_master = true
		@rc_proh_cap = false
	end		

	def check_maintenance(val,com,stat)
		stat['maintenance'] = val if(val != @maintenance)
	end
	def check_rc_proh_stat(val,com,stat)
	end
end
