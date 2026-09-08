import 'package:flutter/material.dart';

/// Maps an EntityCategory (packages/contracts/src/entity.ts) to an icon and
/// accent color, used across the home list, search results, and location
/// details header so every screen reads the category at a glance.
class CategoryStyle {
  final IconData icon;
  final Color color;

  const CategoryStyle(this.icon, this.color);

  static CategoryStyle of(String category) {
    switch (category) {
      case 'SHOPPING_MALL':
        return const CategoryStyle(Icons.local_mall, Color(0xFFE07A5F));
      case 'MARKET':
        return const CategoryStyle(Icons.storefront, Color(0xFFE07A5F));
      case 'HOTEL':
        return const CategoryStyle(Icons.hotel, Color(0xFF3D5A80));
      case 'RESTAURANT':
        return const CategoryStyle(Icons.restaurant, Color(0xFFEE6C4D));
      case 'BANK':
        return const CategoryStyle(Icons.account_balance, Color(0xFF556B72));
      case 'HOSPITAL':
        return const CategoryStyle(Icons.local_hospital, Color(0xFFD62828));
      case 'TOURIST_ATTRACTION':
        return const CategoryStyle(Icons.attractions, Color(0xFF9C6644));
      case 'STORE':
        return const CategoryStyle(Icons.shopping_bag, Color(0xFFE07A5F));
      case 'PHARMACY':
        return const CategoryStyle(Icons.local_pharmacy, Color(0xFF2A9D8F));
      case 'AIRPORT':
        return const CategoryStyle(Icons.flight, Color(0xFF3D5A80));
      case 'RAILWAY_STATION':
        return const CategoryStyle(Icons.train, Color(0xFF3D5A80));
      case 'CINEMA':
        return const CategoryStyle(Icons.theaters, Color(0xFF7B2CBF));
      case 'ENTERTAINMENT_VENUE':
        return const CategoryStyle(Icons.celebration, Color(0xFF7B2CBF));
      case 'UNIVERSITY':
        return const CategoryStyle(Icons.school, Color(0xFF3D5A80));
      case 'OFFICE':
        return const CategoryStyle(Icons.business, Color(0xFF556B72));
      case 'PUBLIC_PLACE':
        return const CategoryStyle(Icons.park, Color(0xFF2A9D8F));
      default:
        return const CategoryStyle(Icons.place, Color(0xFF1E6F5C));
    }
  }
}

String humanizeCategory(String category) {
  final words = category.split('_').map((w) => w.isEmpty ? w : '${w[0]}${w.substring(1).toLowerCase()}');
  return words.join(' ');
}
