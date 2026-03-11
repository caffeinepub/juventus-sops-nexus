import List "mo:core/List";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Nat32 "mo:core/Nat32";
import MixinStorage "blob-storage/Mixin";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  include MixinStorage();

  // Modules for custom types and comparison functions
  module Product {
    public func compare(a : Product, b : Product) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  module Service {
    public func compare(a : Service, b : Service) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  module OrderModule {
    public type Status = {
      #pending;
      #processing;
      #completed;
      #cancelled;
    };
  };

  module Item {
    public func compare(a : CartItem, b : CartItem) : Order.Order {
      switch (Text.compare(a.product.name, b.product.name)) {
        case (#equal) {
          Nat32.compare(a.quantity, b.quantity);
        };
        case (order) {
          order;
        };
      };
    };
  };

  // Types
  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat; // In cents (USD)
    category : Text;
    imageUrl : Text;
    isFeatured : Bool;
    isAvailable : Bool;
  };

  type Service = {
    id : Nat;
    name : Text;
    description : Text;
    priceLabel : Text;
    category : Text;
    imageUrl : Text;
    isFeatured : Bool;
  };

  type CartItem = {
    product : Product;
    quantity : Nat32;
  };

  type OrderType = {
    id : Nat;
    user : Principal;
    items : [CartItem];
    totalAmount : Nat;
    status : OrderModule.Status;
    createdAt : Time.Time;
  };

  type ServiceInquiry = {
    id : Nat;
    user : Principal;
    serviceId : Nat;
    message : Text;
    contactEmail : Text;
    createdAt : Time.Time;
  };

  public type UserProfile = {
    name : Text;
  };

  // Stable storage
  let products = Map.empty<Nat, Product>();
  let services = Map.empty<Nat, Service>();
  let carts = Map.empty<Principal, List.List<CartItem>>();
  let orders = Map.empty<Nat, OrderType>();
  let inquiries = Map.empty<Nat, ServiceInquiry>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Product management
  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func updateProduct(id : Nat, updatedProduct : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) { products.add(id, updatedProduct) };
    };
  };

  public shared ({ caller }) func removeProduct(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    products.remove(id);
  };

  public query ({ caller }) func getProducts(category : ?Text) : async [Product] {
    let iter = products.values();
    let filtered = iter.filter(
      func(p) {
        switch (category) {
          case (null) { true };
          case (?cat) { Text.equal(p.category, cat) };
        };
      }
    );
    filtered.toArray().sort();
  };

  // Service management
  public shared ({ caller }) func addService(service : Service) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    services.add(service.id, service);
  };

  public shared ({ caller }) func updateService(id : Nat, updatedService : Service) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (services.get(id)) {
      case (null) { Runtime.trap("Service not found") };
      case (?_) { services.add(id, updatedService) };
    };
  };

  public shared ({ caller }) func removeService(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    services.remove(id);
  };

  public query ({ caller }) func getServices() : async [Service] {
    services.values().toArray().sort();
  };

  // Cart management
  public shared ({ caller }) func addToCart(productId : Nat, quantity : Nat32) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage cart");
    };
    let product = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?p) { p };
    };
    let cart = getCartInternal(caller);
    let newItem : CartItem = { product; quantity };
    cart.add(newItem);
    carts.add(caller, cart);
  };

  public shared ({ caller }) func removeFromCart(productId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage cart");
    };
    let cart = getCartInternal(caller);
    let filtered = cart.filter(
      func(item) { item.product.id != productId }
    );
    carts.add(caller, filtered);
  };

  public shared ({ caller }) func updateCartItem(productId : Nat, quantity : Nat32) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage cart");
    };
    let cart = getCartInternal(caller);
    let newCart = cart.map<CartItem, CartItem>(func(item) {
      if (item.product.id == productId) {
        { item with quantity };
      } else {
        item;
      };
    });
    carts.add(caller, newCart);
  };

  public shared ({ caller }) func clearCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage cart");
    };
    carts.add(caller, List.empty<CartItem>());
  };

  func getCartInternal(user : Principal) : List.List<CartItem> {
    switch (carts.get(user)) {
      case (null) { List.empty<CartItem>() };
      case (?cart) { cart };
    };
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cart");
    };
    let cart = getCartInternal(caller);
    cart.toArray().sort();
  };

  // Order placement
  public shared ({ caller }) func placeOrder() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };
    let cart = getCartInternal(caller);
    if (cart.size() == 0) { Runtime.trap("Cart is empty") };

    let dotN = orders.size();
    let id = dotN + 1;
    let totalAmount = cart.foldLeft(
      0,
      func(acc, item) { acc + (item.product.price * item.quantity.toNat()) },
    );

    let newOrder : OrderType = {
      id;
      user = caller;
      items = cart.toArray();
      totalAmount;
      status = #pending;
      createdAt = Time.now();
    };

    orders.add(id, newOrder);
    carts.add(caller, List.empty<CartItem>());
  };

  public query ({ caller }) func getOrders() : async [OrderType] {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      // Admin can see all orders
      orders.values().toArray();
    } else if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      // Users can only see their own orders
      let userOrders = orders.values().filter(
        func(order) { order.user == caller }
      );
      userOrders.toArray();
    } else {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : OrderModule.Status) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder : OrderType = {
          order with status;
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  // Service inquiries
  public shared ({ caller }) func submitInquiry(serviceId : Nat, message : Text, contactEmail : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit inquiries");
    };
    let dotN = inquiries.size();
    let id = dotN + 1;
    let newInquiry : ServiceInquiry = {
      id;
      user = caller;
      serviceId;
      message;
      contactEmail;
      createdAt = Time.now();
    };
    inquiries.add(id, newInquiry);
  };

  public query ({ caller }) func getInquiries() : async [ServiceInquiry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view inquiries");
    };
    inquiries.values().toArray();
  };
};
