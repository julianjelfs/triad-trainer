# Triad Trainer

![C major walked up the neck on strings 4-3-2: first inversion at the nut, second inversion at the fifth fret, root position at the tenth, then first inversion again an octave up](docs/positions.gif)

Guitar triad drill. It hands you a chord on a string set, picked from whatever
you have practised least, and the metronome walks you through every inversion
of it from the lowest position on the neck to the highest, a bar to each shape,
wrapping back to the bottom until you stop.

You do not choose the chord itself. You tick which qualities, string sets and
keys are in play, and it picks from those, leaning towards whatever you have
been neglecting. Narrow it to one key when you want to work on one; the
practice log will show what that is costing the others.

All three inversions are always in play. Moving between them is the exercise,
so leaving one out makes it a different drill rather than a smaller one.

## Using it

Three beats to a bar, one per note of the triad, and the shape changes on beat
one. Say the note before you play it.

Every position in the drill sits on the neck as a faint disc, with the shape
you are on drawn solid on top, so you can see the whole run and where you are
going next.

The squares under the diagram step through the positions by hand, for getting
your bearings before you start counting. Browsing is not practice, so nothing
you do there is logged.

**Done** logs the shape on screen and moves on to another chord. **New drill**
moves on without logging it. Both stop the metronome.

The practice log at the bottom shows what you have played and, more usefully,
what you have been avoiding.

## Comping

The drill teaches you where each chord's triads are. Comping mode is for using
them over changes, where the next chord shows up whether you've found it or not.

Switch to **Comping** at the top, then pick a progression, a key, a string set
and a sound. Press Start and you get one bar of clicks, then the progression on
piano or guitar, round and round. Bass on one and three, chord on two and four,
all of it below middle C so it sits under what you play.

Play a triad for each chord. The fretboard shows the nearest triad of the
current chord to a zone of the neck, and a faint one for the next chord. The
zone starts around the first fret and moves up two frets every time round the
progression, then wraps back down. One lap takes you through the whole neck,
and moving to the next chord is never more than a short shift.

The sounds are real samples, fetched the first time you press Start, so that
first time needs an internet connection. Nothing in comping mode goes into the
practice log.

## Saying "next"

While you are finding the shapes, the "Listen for next" toggle advances a
position when you say the word, so you can keep both hands on the guitar.

Worth knowing before you switch it on: the audio is not processed on your
machine. This is the browser's speech recognition, and Chrome implements it by
streaming microphone audio to Google's servers. It runs only while the toggle
is on, and it is off by default, but that is the trade. Chrome and Edge only.
Starting the metronome switches it off, since the clicks are all it would hear.

## Running it

Once, to install:

```sh
cd backend  && uv sync
cd frontend && npm install
```

Then, to run:

```sh
./scripts/dev.sh
```

Open <http://localhost:5173>. Ctrl-C stops both halves.

## Having it always there

To stop thinking about starting it:

```sh
./scripts/install-service.sh
```

That builds the frontend, has the API serve it so the whole thing is one
process on one port, installs a launchd agent that starts it at login and
restarts it if it dies, and puts a `triad-trainer` command on your PATH.

```sh
triad-trainer            # open it
triad-trainer status     # running? reachable where?
triad-trainer rebuild    # after changing code
triad-trainer logs
```

To reach it from your other machines, `triad-trainer serve` publishes it to
your tailnet over HTTPS at `https://<this-machine>.<tailnet>.ts.net:8443`. It
stays bound to loopback; Tailscale does the proxying, and nothing is exposed to
the public internet. HTTPS has to be enabled for your tailnet first, under DNS
in the admin console — without it the microphone is blocked on every machine
but this one, so voice stepping would not work remotely.

Your practice history lives in `backend/triads.db`, on this machine and nowhere
else. Deleting that file resets the log and nothing else.
