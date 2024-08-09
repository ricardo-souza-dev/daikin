#coding: utf-8

require_relative 'ManagementPoint'

# Di for Check in/out status
class Rent < Di
	def initialize(pid, dev_id)
		super
		@save = true
	end
end
