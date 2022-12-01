PREFIX = /usr

all:
	-@echo do nothing

install:
	install -Dm0644 tesliot.js -t $(DESTDIR)$(PREFIX)/share/wb-rules-system/rules
	install -Dm0755 tesliot.sh -t $(DESTDIR)$(PREFIX)/lib/wb-ble-tesliot
	install -Dm0644 wb-ble-tesliot.conf -t $(DESTDIR)$(PREFIX)/etc
clean:
	-@echo "do nothing"

.PHONY: all install clean
