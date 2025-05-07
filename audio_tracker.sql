-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 06, 2025 at 12:30 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `audio_tracker`
--

-- --------------------------------------------------------

--
-- Table structure for table `playlists`
--

CREATE TABLE `playlists` (
  `id` int(11) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `playlist_songs`
--

CREATE TABLE `playlist_songs` (
  `id` int(11) NOT NULL,
  `playlist_id` int(11) NOT NULL,
  `song_name` varchar(255) NOT NULL,
  `artist_name` varchar(255) NOT NULL,
  `album_cover_url` text DEFAULT NULL,
  `spotify_url` text DEFAULT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `search_history`
--

CREATE TABLE `search_history` (
  `id` int(11) NOT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `query` varchar(255) DEFAULT NULL,
  `search_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `search_history`
--

INSERT INTO `search_history` (`id`, `user_email`, `query`, `search_time`) VALUES
(1, 'testing12@gmail.com', 'Drake', '2025-05-06 01:45:08'),
(2, 'testing12@gmail.com', 'Sza', '2025-05-06 01:45:17'),
(3, 'testing12@gmail.com', 'Sza', '2025-05-06 01:51:15'),
(4, 'testing12@gmail.com', 'Meep', '2025-05-06 01:51:28'),
(5, 'testing12@gmail.com', 'drake', '2025-05-06 01:55:35'),
(6, 'testing12@gmail.com', 'drake', '2025-05-06 01:56:42'),
(7, 'testing12@gmail.com', 'drake', '2025-05-06 01:56:55'),
(8, 'testing12@gmail.com', 'drake', '2025-05-06 01:57:17'),
(9, 'testing12@gmail.com', 'okay', '2025-05-06 01:57:48'),
(10, 'testing12@gmail.com', 'drake', '2025-05-06 02:01:09'),
(11, 'testing12@gmail.com', 'drake', '2025-05-06 02:04:18'),
(12, 'testing12@gmail.com', 'drake', '2025-05-06 02:06:34'),
(13, 'testing12@gmail.com', 'meep2', '2025-05-06 02:06:41'),
(14, 'testing12@gmail.com', 'drake', '2025-05-06 02:11:52'),
(15, 'testing12@gmail.com', 'drake', '2025-05-06 02:15:53'),
(16, 'testing12@gmail.com', 'sza', '2025-05-06 02:15:59'),
(17, 'testing12@gmail.com', 'drake', '2025-05-06 02:16:21'),
(18, 'testing12@gmail.com', 'drake', '2025-05-06 03:34:43'),
(19, 'testing12@gmail.com', 'Drake', '2025-05-06 03:52:37'),
(20, 'testing12@gmail.com', 'Drake', '2025-05-06 04:57:19'),
(21, 'testing12@gmail.com', 'Meep', '2025-05-06 04:58:11'),
(22, 'testing12@gmail.com', 'Test1', '2025-05-06 04:59:23'),
(23, 'testing12@gmail.com', 'King Von', '2025-05-06 05:44:39'),
(24, 'testing2@gmail.com', 'meep', '2025-05-06 05:56:12'),
(25, 'testing2@gmail.com', 'drake', '2025-05-06 06:12:11'),
(26, 'testing2@gmail.com', 'meep', '2025-05-06 06:14:55'),
(27, 'testing2@gmail.com', 'drake', '2025-05-06 06:15:56'),
(28, 'testing2@gmail.com', 'Drake', '2025-05-06 06:33:02'),
(29, 'testing2@gmail.com', 'drake', '2025-05-06 07:07:46'),
(30, 'testing2@gmail.com', 'anxiety', '2025-05-06 07:31:42'),
(31, 'testing2@gmail.com', 'Sza', '2025-05-06 07:32:18'),
(32, 'testing2@gmail.com', 'Sza', '2025-05-06 07:34:19'),
(33, 'testing2@gmail.com', 'Sza', '2025-05-06 07:34:24'),
(34, 'testing2@gmail.com', 'Drake', '2025-05-06 07:34:29'),
(35, 'testing2@gmail.com', 'Sza', '2025-05-06 07:34:45'),
(36, 'testing2@gmail.com', 'drake', '2025-05-06 07:38:59'),
(37, 'testing2@gmail.com', 'drake', '2025-05-06 07:42:01'),
(38, 'testing2@gmail.com', 'sza', '2025-05-06 07:42:08'),
(39, 'testing2@gmail.com', 'Marias', '2025-05-06 07:42:21'),
(40, 'testing2@gmail.com', 'sza', '2025-05-06 08:08:30'),
(41, 'testing2@gmail.com', 'sza', '2025-05-06 08:10:59'),
(42, 'testing2@gmail.com', 'Drake', '2025-05-06 08:13:07'),
(43, 'testing2@gmail.com', 'drake', '2025-05-06 08:16:59'),
(44, 'testing2@gmail.com', 'drake', '2025-05-06 08:18:00'),
(45, 'testing2@gmail.com', 'I\'m okay', '2025-05-06 08:21:05'),
(46, 'testing2@gmail.com', 'sza', '2025-05-06 08:28:33'),
(47, 'testing2@gmail.com', 'sza', '2025-05-06 08:28:56'),
(48, 'testing2@gmail.com', 'sza', '2025-05-06 08:31:32'),
(49, 'testing2@gmail.com', 'sza', '2025-05-06 08:37:39'),
(50, 'testing2@gmail.com', 'sza', '2025-05-06 08:41:38'),
(51, 'testing2@gmail.com', 'sza', '2025-05-06 08:44:38'),
(52, 'testing2@gmail.com', 'sza', '2025-05-06 08:46:27'),
(53, 'testing2@gmail.com', 'sza', '2025-05-06 08:47:57'),
(54, 'testing2@gmail.com', 'drake', '2025-05-06 08:58:14'),
(55, 'testing2@gmail.com', 'drake', '2025-05-06 08:58:14'),
(56, 'testing2@gmail.com', 'drake', '2025-05-06 09:00:58'),
(57, 'testing2@gmail.com', 'sza', '2025-05-06 09:01:51'),
(58, 'testing2@gmail.com', 'Spongebob Stuff', '2025-05-06 09:13:57'),
(59, 'testing2@gmail.com', 'Meep', '2025-05-06 09:28:54'),
(60, 'testing2@gmail.com', 'Random', '2025-05-06 09:29:05');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`) VALUES
(2, 'testing1@gmail.com', '$2b$10$/Ir7iUVsrlNK0.spDQCd1uJ6WeY/yLdsDncD66bJ7wenuKawIB7FO'),
(7, 'Testing12@gmail.com', '$2b$10$NtkXh7blH/fJ8.1kxE1.lecdZi0cin0gefKJEUgC0q3cO/qRM5neu'),
(11, 'testing2@gmail.com', '$2b$10$dFjz2lj84.m5emMzLLg4r.whaYPXzeCT/AwLo0AODQ9TD/2gO9e7i');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `playlists`
--
ALTER TABLE `playlists`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `playlist_songs`
--
ALTER TABLE `playlist_songs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `playlist_id` (`playlist_id`);

--
-- Indexes for table `search_history`
--
ALTER TABLE `search_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `playlists`
--
ALTER TABLE `playlists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `playlist_songs`
--
ALTER TABLE `playlist_songs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `search_history`
--
ALTER TABLE `search_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `playlist_songs`
--
ALTER TABLE `playlist_songs`
  ADD CONSTRAINT `playlist_songs_ibfk_1` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
