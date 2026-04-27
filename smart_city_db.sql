-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 26 Apr 2026 pada 19.09
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smart_city_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `report_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `likes` int(11) DEFAULT 0,
  `is_edited` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `facilities`
--

CREATE TABLE `facilities` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `operating_hours` varchar(100) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `facilities`
--

INSERT INTO `facilities` (`id`, `name`, `type`, `address`, `phone`, `operating_hours`, `image_path`, `latitude`, `longitude`, `created_at`, `updated_at`) VALUES
(1, 'RSUD Kota Sejahtera', 'hospital', 'Jl. Kesehatan No. 1, Kota Sejahtera', '(021) 555-1234', '24 Jam', '/facility/RSUD.webp', NULL, NULL, '2026-04-24 20:14:32', '2026-04-26 02:13:26'),
(2, 'Polresta Kota Sejahtera', 'police', 'Jl. Keamanan No. 10, Kota Sejahtera', '(021) 555-9110', '24 Jam', '/facility/Polresta.jpeg', NULL, NULL, '2026-04-24 20:14:32', '2026-04-26 02:13:26'),
(3, 'Pos Pemadam Kebakaran Pusat', 'fire_station', 'Jl. Penyelamatan No. 5, Kota Sejahtera', '(021) 555-1133', '24 Jam', '/facility/PosPemadam.webp', NULL, NULL, '2026-04-24 20:14:32', '2026-04-26 02:13:27'),
(4, 'RS Bhakti Husada', 'hospital', 'Jl. Raya Barat No. 25, Kota Sejahtera', '(021) 555-5678', '24 Jam', '/facility/RS.jpeg', NULL, NULL, '2026-04-24 20:14:32', '2026-04-26 02:13:26'),
(5, 'Klinik Pratama Sehat', 'clinic', 'Jl. Melati No. 8, Kota Sejahtera', '(021) 555-3344', '08:00 - 20:00', '/facility/klinik.jpg', NULL, NULL, '2026-04-24 20:14:32', '2026-04-26 02:13:26'),
(6, 'Polsek Timur', 'police', 'Jl. Anggrek No. 17, Kota Sejahtera', '(021) 555-9111', '24 Jam', '/facility/Polsek.jpeg', NULL, NULL, '2026-04-24 20:14:32', '2026-04-26 02:13:26');

-- --------------------------------------------------------

--
-- Struktur dari tabel `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `facility_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `location_text` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `status` enum('new','in_progress','resolved','hidden') NOT NULL DEFAULT 'new',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `flagged` tinyint(1) DEFAULT 0,
  `vote_count` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `reports`
--

INSERT INTO `reports` (`id`, `user_id`, `facility_id`, `title`, `description`, `image_path`, `location_text`, `latitude`, `longitude`, `status`, `is_read`, `flagged`, `vote_count`, `created_at`, `updated_at`) VALUES
(99, 12, 1, 'Lampu Jalan Mati di Depan RSUD', 'Lampu jalan utama depan RSUD sudah 3 hari mati, sangat gelap malam hari.', NULL, 'Jl. Kesehatan No.1', NULL, NULL, 'resolved', 1, 0, 15, '2026-04-20 09:15:00', '2026-04-26 09:34:09'),
(100, 13, NULL, 'Sampah Menumpuk di Pasar', 'Tumpukan sampah di belakang pasar tradisional sudah seminggu tidak diangkut.', NULL, 'Pasar Induk, Jl. Pasar Baru', NULL, NULL, 'in_progress', 1, 0, 8, '2026-04-21 10:30:00', '2026-04-25 20:12:21'),
(101, 14, 2, 'Trotoar Rusak di Polresta', 'Trotoar di seberang Polresta ambles, membahayakan pejalan kaki.', NULL, 'Jl. Keamanan No.10', NULL, NULL, 'in_progress', 1, 0, 5, '2026-04-22 08:00:00', '2026-04-25 20:12:21'),
(102, 15, NULL, 'Jembatan Retak di Desa', 'Jembatan kecil di desa retak cukup parah.', NULL, 'Desa Sukamaju', NULL, NULL, 'in_progress', 1, 0, 9, '2026-04-17 07:30:00', '2026-04-25 20:12:21'),
(103, 12, 3, 'Kebakaran Lahan Kosong Dekat Pos Damkar', 'Lahan kosong belakang Pos Damkar terbakar semalam.', NULL, 'Belakang Pos Damkar', NULL, NULL, 'in_progress', 1, 0, 20, '2026-04-19 22:00:00', '2026-04-25 20:12:21'),
(104, 13, 4, 'Parkir Liar di Depan RS', 'Kendaraan parkir sembarangan di depan RS Bhakti Husada.', NULL, 'Jl. Raya Barat No.25', NULL, NULL, 'resolved', 1, 0, 12, '2026-04-23 07:45:00', '2026-04-26 03:11:32'),
(105, 14, 5, 'Vandalisme di Klinik', 'Dinding klinik dicorat-coret.', NULL, 'Klinik Pratama Sehat', NULL, NULL, 'hidden', 1, 0, 0, '2026-04-25 13:10:00', '2026-04-25 20:12:21'),
(106, 12, 1, 'Pohon Tumbang di Halaman RSUD', 'Pohon besar tumbang akibat angin kencang.', NULL, 'Halaman RSUD Kota Sejahtera', NULL, NULL, 'in_progress', 1, 0, 30, '2026-04-18 16:20:00', '2026-04-26 03:11:32'),
(107, 13, 6, 'Kebisingan di Polsek', 'Motor berknalpot bising di depan Polsek.', NULL, 'Jl. Anggrek No.17', NULL, NULL, 'in_progress', 1, 0, 6, '2026-04-25 21:00:00', '2026-04-25 20:12:21'),
(108, 14, NULL, 'Saluran Air Tersumbat di Perumahan', 'Drainase tersumbat sampah plastik.', NULL, 'Komplek Griya Asri', NULL, NULL, 'in_progress', 1, 0, 3, '2026-04-24 11:00:00', '2026-04-25 20:12:21');

-- --------------------------------------------------------

--
-- Struktur dari tabel `report_flags`
--

CREATE TABLE `report_flags` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `report_id` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `role` enum('citizen','admin') NOT NULL DEFAULT 'citizen',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `address`, `role`, `created_at`) VALUES
(7, 'Administrator', 'admin@smartcity.local', '$2b$10$.7F0wLhIu7H4ie.nc8fOGOAsFiAZ4KrRf/VFOHWg2uQJy3hyzgNLK', NULL, NULL, 'admin', '2026-04-25 22:32:21'),
(12, 'Andi Wibowo', 'andi@warga.com', '$2b$10$8KzQMZGEHcF6sV7QaGmfIu5GvXQbUZ4nI0l9EQfD1Pm3H8rx1OVYm', '08123456789', 'Jl. Melati No.10', 'citizen', '2026-04-26 03:11:32'),
(13, 'Siti Rahayu', 'siti@warga.com', '$2b$10$8KzQMZGEHcF6sV7QaGmfIu5GvXQbUZ4nI0l9EQfD1Pm3H8rx1OVYm', '08567812345', 'Jl. Anggrek No.5', 'citizen', '2026-04-26 03:11:32'),
(14, 'Budi Santoso', 'budi@warga.com', '$2b$10$8KzQMZGEHcF6sV7QaGmfIu5GvXQbUZ4nI0l9EQfD1Pm3H8rx1OVYm', '08134567890', 'Jl. Mawar No.2', 'citizen', '2026-04-26 03:11:32'),
(15, 'Dewi Lestari', 'dewi@warga.com', '$2b$10$8KzQMZGEHcF6sV7QaGmfIu5GvXQbUZ4nI0l9EQfD1Pm3H8rx1OVYm', '08215678901', 'Jl. Dahlia No.7', 'citizen', '2026-04-26 03:11:32');

-- --------------------------------------------------------

--
-- Struktur dari tabel `user_report_votes`
--

CREATE TABLE `user_report_votes` (
  `user_id` int(11) DEFAULT NULL,
  `report_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Trigger `user_report_votes`
--
DELIMITER $$
CREATE TRIGGER `trg_vote_delete` AFTER DELETE ON `user_report_votes` FOR EACH ROW UPDATE `reports`
  SET `vote_count` = `vote_count` - 1
  WHERE `id` = OLD.report_id
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_vote_insert` AFTER INSERT ON `user_report_votes` FOR EACH ROW UPDATE `reports`
  SET `vote_count` = `vote_count` + 1
  WHERE `id` = NEW.report_id
$$
DELIMITER ;

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_report` (`report_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_parent` (`parent_id`),
  ADD KEY `idx_likes` (`likes`);

--
-- Indeks untuk tabel `facilities`
--
ALTER TABLE `facilities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type`);

--
-- Indeks untuk tabel `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_facility` (`facility_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_location` (`location_text`(100));

--
-- Indeks untuk tabel `report_flags`
--
ALTER TABLE `report_flags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_report` (`user_id`,`report_id`),
  ADD KEY `report_id` (`report_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_email` (`email`);

--
-- Indeks untuk tabel `user_report_votes`
--
ALTER TABLE `user_report_votes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_vote` (`user_id`,`report_id`),
  ADD KEY `idx_report` (`report_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `facilities`
--
ALTER TABLE `facilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT untuk tabel `report_flags`
--
ALTER TABLE `report_flags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT untuk tabel `user_report_votes`
--
ALTER TABLE `user_report_votes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_fk_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_fk_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_fk_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reports_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `report_flags`
--
ALTER TABLE `report_flags`
  ADD CONSTRAINT `report_flags_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `report_flags_ibfk_2` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `user_report_votes`
--
ALTER TABLE `user_report_votes`
  ADD CONSTRAINT `votes_fk_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `votes_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
