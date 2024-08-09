#coding: utf-8

class GpioPin
	def initialize(pin,dir,inv=false)
		@pin = pin 	# gpio pin number
		@dir = dir 	# in/out
		@inv = inv	# true: 1=>on, 0=>off, false: 1=off, 0=>on
		@stat	= -1			# status 1/0
		@changed = false

		system("gpio -g mode #{@pin} up")
		system("gpio -g mode #{@pin} #{@dir}")
	end

	def stat
		stat = `gpio -g read #{@pin}`.strip.to_i
		if(@stat != stat)
			@changed = true 
			@stat = stat
		else
			@changed = false
		end
		return 'on' if((@stat == 0 && @inv == false) || (@stat == 1 && @inv == true))
		return 'off'
	end

	def changed?
		return @changed
	end

	# com is 'on' or 'off'
	def write(com)
		return if(@dir != 'out')
		stat = 0
		stat = 1 if(com == 'on')
		`gpio -g write #{@pin} #{stat}`
	end
end

#a = GpioPin.new(5,'in')
#loop {
#	puts a.stat
#	sleep 1
#}
