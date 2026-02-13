# ============================================================
# Stage 1: Build libpafe from source
# ============================================================
FROM ubuntu:22.04 AS libpafe-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libtool \
    libusb-1.0-0-dev \
    pkg-config \
    git \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/rfujita/libpafe.git /tmp/libpafe

# libpafe ships pre-generated configure script (configure.in, old-style autotools).
# Do NOT run autoreconf - it breaks the old-style build system.
WORKDIR /tmp/libpafe
RUN ./configure --prefix=/usr/local
RUN make -j"$(nproc)" && make install

# ============================================================
# Stage 2: Build Rust application
# ============================================================
FROM rust:1-bookworm AS rust-builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpcsclite-dev \
    libusb-1.0-0-dev \
    pkg-config \
  && rm -rf /var/lib/apt/lists/*

# Copy libpafe from stage 1
COPY --from=libpafe-builder /usr/local/lib/libpafe* /usr/local/lib/
COPY --from=libpafe-builder /usr/local/include/ /usr/local/include/
RUN ldconfig

WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY src/ ./src/

RUN cargo build --release

# ============================================================
# Stage 3: Runtime image
# ============================================================
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    pcscd \
    pcsc-tools \
    libpcsclite1 \
    libccid \
    libusb-1.0-0 \
    ca-certificates \
    mpg123 \
    alsa-utils \
    pulseaudio-utils \
  && rm -rf /var/lib/apt/lists/*

# Copy libpafe shared library and recreate symlinks
# (Docker COPY flattens symlinks, so ldconfig won't register libpafe.so;
#  we copy the real library and create proper symlinks manually.)
COPY --from=libpafe-builder /usr/local/lib/libpafe.so.0.0.7 /usr/local/lib/
RUN ln -sf libpafe.so.0.0.7 /usr/local/lib/libpafe.so.0 \
 && ln -sf libpafe.so.0.0.7 /usr/local/lib/libpafe.so \
 && ldconfig

# Copy sound files
COPY src/paypay.mp3 /usr/local/share/sounds/paypay.mp3
COPY src/error.wav /usr/local/share/sounds/error.wav

# Copy the built binary
COPY --from=rust-builder /build/target/release/felica_scanner /usr/local/bin/felica_scanner

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV API_URL=http://host.docker.internal:8000/api/scan

ENTRYPOINT ["/entrypoint.sh"]
