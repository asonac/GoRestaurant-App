import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { forNoAnimation } from '@react-navigation/stack/lib/typescript/src/TransitionConfigs/HeaderStyleInterpolators';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
  category: number;
  thumbnail_url: string;
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      api.get<Food>(`foods/${routeParams.id}`).then(response => {
        // console.log(response.data);
        response.data.formattedPrice = formatValue(response.data.price);

        setFood(response.data);

        const extrasInfo = response.data.extras.map(extra => {
          const setExtra = {
            id: extra.id,
            name: extra.name,
            value: extra.value,
            quantity: 0,
          };
          return setExtra;
        });

        setExtras(extrasInfo);
      });

      api.get<Food[]>('favorites').then(response => {
        const findIndex = response.data.findIndex(
          favoriteFood => favoriteFood.id === routeParams.id,
        );

        if (findIndex >= 0) {
          setIsFavorite(true);
        }
      });
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const findExtraIndex = extras.findIndex(extra => extra.id === id);

    extras[findExtraIndex].quantity += 1;

    setExtras([...extras]);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const findExtraIndex = extras.findIndex(extra => extra.id === id);

    if (extras[findExtraIndex].quantity > 0) {
      extras[findExtraIndex].quantity -= 1;

      setExtras([...extras]);
    }
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    const incrementFoodQuantity = foodQuantity + 1;
    setFoodQuantity(incrementFoodQuantity);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity > 1) {
      const decrementFoodQuantity = foodQuantity - 1;
      setFoodQuantity(decrementFoodQuantity);
    }
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not

    if (isFavorite) {
      api.delete(`favorites/${food.id}`).then(() => {
        setIsFavorite(!isFavorite);
      });
    } else {
      const favoriteFood = food;
      delete favoriteFood.extras;
      delete favoriteFood.formattedPrice;
      api.post('favorites', favoriteFood).then(() => {
        setIsFavorite(!isFavorite);
      });
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    let total = 0;

    extras.forEach(extra => {
      total += extra.value * extra.quantity * foodQuantity;
    });

    total += food.price * foodQuantity;

    return formatValue(total);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    let quantity = 0;

    const orderExtras = extras.filter(extra => extra.quantity > 0);

    while (quantity !== foodQuantity) {
      const order = {
        id: 0,
        product_id: food.id,
        name: food.name,
        description: food.description,
        price: food.price,
        category: food.category,
        thumbnail_url: food.thumbnail_url,
        extras: orderExtras,
      };

      api.post('orders', order);
      quantity += 1;
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
