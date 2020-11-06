let cursorShape = '█';
const Typer = {
	text: '',
	accessCountimer: null,
	index: 0,
	speed: 2,
	file: '',
	accessCount: 0,
	deniedCount: 0,
	init: function () {
		accessCountimer = setInterval(function () {
			Typer.updLstChr();
		}, 500);
		$.get(Typer.file, function (data) {
			Typer.text = data;
			Typer.text = Typer.text.slice(0, Typer.text.length - 1);
		});
	},

	content: function () {
		return $('#console').html();
	},

	write: function (str) {
		$('#console').append(str);
		return false;
	},

	addText: function (key) {
		if (key.keyCode == 18) {
			Typer.accessCount++;
		} else if (key.keyCode == 20) {
			Typer.deniedCount++;
		} else if (Typer.text) {
			let cont = Typer.content();
			if (cont.substring(cont.length - 1, cont.length) == cursorShape)
				$('#console').html(
					$('#console')
						.html()
						.substring(0, cont.length - 1),
				);
			if (key.keyCode != 8) {
				Typer.index += Typer.speed;
			} else {
				if (Typer.index > 0) Typer.index -= Typer.speed;
			}
			var text = Typer.text.substring(0, Typer.index) + cursorShape;
			var rtn = new RegExp('\n', 'g');

			$('#console').html(text.replace(rtn, '<br/>'));
			window.scrollBy(0, 50);
		}

		if (key.preventDefault && key.keyCode != 122) {
			key.preventDefault();
		}

		if (key.keyCode != 122) {
			// otherway prevent keys default behavior
			key.returnValue = false;
		}
	},

	updLstChr: function () {
		let cont = this.content();

		if (cont.substring(cont.length - 1, cont.length) == cursorShape)
			$('#console').html(
				$('#console')
					.html()
					.substring(0, cont.length - 1),
			);
		else this.write(cursorShape); // else write it
	},
};

Typer.speed = 3;
Typer.file = 'Mahdiyar.txt';
Typer.init();

let timer = setInterval('t();', 50);

function t() {
	Typer.addText({keyCode: 123748});
	if (Typer.index > Typer.text.length) {
		clearInterval(timer);
	}
	document.getElementById("E").href = "mailto:mahdiyar.zerehpoush@gmail.com";
	document.getElementById("G").href = "https://github.com/smzerehpoush";
	document.getElementById("T").href = "https://twitter.com/SeyyedMahdiyar";
	document.getElementById("L").href = "https://linkedin.com/in/mahdiyar-zerehpoush";
	document.getElementById("R").href = "assets/Resume.pdf";

}
