var imgext = ".png";
var imgsize = 150;
var score = 0;
var themepath = "emeralds";
var slots = [new Slot(0, 15), new Slot(1, 20), new Slot(2, 25)];

//A representation of a slot, storing its current state
function Slot(id, freeSpaceDelay)
{
	this.id = id;
	this.freeSpaceDelay = freeSpaceDelay || 15;
	this.freeSpaceCount = 0;
	this.freeSpaceOffset = -1;
	this.isSpinning = false;
	this.isSlowing = false;
	this.needsUpdate = false;
	this.currentSpinPercent = 0;
	this.incrIndex = function(amnt)
	{
		this.currentSpinPercent += amnt * 100;
		this.freeSpaceCount += amnt;
	}
	this.setSpinning = function(bool)
	{
		if(bool)
		{
			if(!this.isSpinning)
			{
				this.physTime = 0;
				this.isSpinning = true;
			}
		}
		else
		{
			if(this.isSpinning)
				this.isSlowing = true;
		}
	};
	this.physTime = 0;
	this.currIndex = 0;
	this.pics = ["0.png", "1.png", "2.png", "3.png", "4.png", "5.png", "6.png"];
	this.column = document.getElementById("col" + this.id);

	this.initialize = function()
	{
		this.shufflePics();
		for(var i = 0; i < 4; ++i)
		{
			var img = document.createElement("img");
			img.src = "pics/slot/" + themepath + "/" + this.pics[i];
			img.width = 150;
			document.getElementById(this.id + "," + i).appendChild(img);
		}
	}

	this.updatePosition = function(checkforwin)
	{
		if(this.currentSpinPercent >= 100 || this.needsUpdate)
		{
			var overflow = this.currentSpinPercent % 100;
			var slotshifts = (this.currentSpinPercent - overflow) / 100;

			this.currentSpinPercent = overflow;
			this.currIndex -= slotshifts;

			this.freeSpaceCount += slotshifts;

			if(this.currIndex < 0)
			{
				this.currIndex = 6;
			}

			if(this.freeSpaceCount >= this.freeSpaceDelay && this.freeSpaceOffset < 4 && !this.needsUpdate)
			{
				this.freeSpaceOffset += slotshifts;
			}
			else if(this.freeSpaceOffset >= 4)
			{
				this.freeSpaceOffset = -1;
				this.freeSpaceCount = this.freeSpaceCount - this.freeSpaceDelay;
			}

			for(var i = 0; i < 4; ++i)
			{
				if(this.freeSpaceOffset != i)
				{
					var index = i + this.currIndex;
					if(index >= this.pics.length)
					{
						index -= this.pics.length;
					}

					document.getElementById(this.id + "," + i).childNodes[0].src = "pics/slot/" + themepath + "/" + this.pics[index];
				}
				else
				{
					document.getElementById(this.id + "," + i).childNodes[0].src = "pics/slot/" + themepath + "/free.png";
				}
			}
		}
		this.column.style.top = this.currentSpinPercent/100*imgsize + "px";

		if(checkforwin)
		{
			checkForWin();
		}
		this.needsUpdate = false;
	}

	//Fisher-Yates (aka Knuth) Shuffle, stolen/borrowed from stackoverflow
	this.shufflePics = function()
	{
		var currentIndex = this.pics.length, temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex)
		{
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = this.pics[currentIndex];
			this.pics[currentIndex] = this.pics[randomIndex];
			this.pics[randomIndex] = temporaryValue;
		}
	}
}

//Initializes all slots and begins the update loop
function init()
{
	for(var i = 0; i < slots.length; ++i)
	{
		slots[i].initialize();
	}

	requestAnimationFrame(update);
}

//Loops through all slots and adjusts them based on their momentum and current state
function update()
{
	var checkforwin = false;

	for(var i = 0; i < slots.length; ++i)
	{
		if(slots[i].isSpinning)
		{
			slots[i].currentSpinPercent += (0.5)*0.5*Math.pow(slots[i].physTime/5, 2)-100 % 100;

			if(slots[i].isSlowing)
			{
				if(slots[i].physTime > 0)
				{
					slots[i].physTime -= 0.5;
				}
				else if(slots[i].physTime <= 0)
				{
					slots[i].physTime = 0;
					slots[i].isSpinning = false;
					slots[i].isSlowing = false;

					slots[i].currentSpinPercent = slots[i].currentSpinPercent > 50 ? 100 : 0;

					if(i == 2)
					{
						checkforwin = true;
					}
				}
			}
			else
			{
				if(slots[i].physTime < 50) slots[i].physTime += 0.5;
			}
		}
	}

	for(var i = 0; i < slots.length; ++i)
	{
		slots[i].updatePosition(i == 2 ? checkforwin : false);
	}

	requestAnimationFrame(update);
}

//Adds to a slot's current index, overflowing back to 0 when it reaches the end of the pics array
function normalizeIndex(i, index)
{
	if(index >= slots[i].pics.length)
		return index-slots[i].pics.length;
	else return index;
}

//Checks if two slot images match by comparing their filenames
function matchWith(img1, img2, img3)
{
	var matches = false;
	if(img1 == img2 && img2 == img3)
	{
		matches = true;
	}
	else if(img1 == "free" && img2 == img3)
	{
		matches = true;
	}
	else if(img2 == "free" && img1 == img3)
	{
		matches = true;
	}
	else if(img3 == "free" && img1 == img2)
	{
		matches = true;
	}
	else if((img1 == "free" && img2 == "free") || (img2 == "free" && img3 == "free") || (img1 == "free" && img3 == "free"))
	{
		matches = true;
	}
	return matches;
}

//Checks if there's a winning horizontal or diagonal match, and confirms it if there is
function checkForWin()
{
	var row = [];
	for(var y = 1; y < 4; ++y)
	{
		//Horizontal checking
		row.push([]);
		for(var x = 0; x < 3; ++x)
		{
			var el = document.getElementById(x + "," + y).childNodes[0];
			var img = el.src.split("/").reverse()[0].replace(".png", "");

			row[y-1].push(img);
		}

		if(matchWith(row[y-1][0], row[y-1][1], row[y-1][2]))
		{
			confirmWin("horizontal", y);
		}
	}

	if(matchWith(row[0][0], row[1][1], row[2][2]))
	{
		confirmWin("diagonal", 0);
	}
	else if (matchWith(row[0][2], row[1][1], row[2][0]))
	{
		confirmWin("diagonal", 1);
	}
}

//Handles animation and point addition when a match is found
function confirmWin(direction, index)
{
	if(direction == "horizontal")
	{
		for(var i = 0; i < 3; ++i)
		{
			document.getElementById(i + "," + index).style.animation = "flash 0.5s linear infinite";
		}
		score += 10;
	}
	else if(direction == "diagonal")
	{
		if(index == 0)
		{
			for(var i = 0; i < 3; ++i)
			{
				document.getElementById(i + "," + (i+1)).style.animation = "flash 0.5s linear infinite";
			}
			score += 20;
		}
		else
		{
			for(var i = 0; i < 3; ++i)
			{
				document.getElementById(i + "," + Math.abs(i-3)).style.animation = "flash 0.5s linear infinite";
			}
			score += 20;
		}
	}

	document.getElementById("score").innerHTML = "Score: " + score;
}

//Resets the flashing animation
function resetHighlight()
{
	var lis = document.getElementsByTagName("li");
	for(var i = 0; i < lis.length; ++i)
	{
		lis[i].style.animation = "stop 1s";
	}
}

//Handles the start button
var lastStopped = 0;
function startBtnPress()
{
	for(var i = 0; i < slots.length; ++i)
	{
		slots[i].setSpinning(true);
	}
	lastStopped = 0;

	resetHighlight();
}

//Handles the stop button
function stopBtnPress()
{
	slots[lastStopped].setSpinning(false);
	if(lastStopped < 2)
		lastStopped++;
	else
		lastStopped = 0;
}
